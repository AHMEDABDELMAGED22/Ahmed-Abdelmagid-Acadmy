import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { computeLessonFlow, finalizeLessonIfComplete } from "@/lib/learning/lesson-flow";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { video_id, percentage, is_completed } = body;

    if (!video_id) {
      return NextResponse.json({ error: "Missing video_id" }, { status: 400 });
    }

    const { error } = await supabase.from("video_completion").upsert(
      {
        video_id,
        student_id: user.id,
        completion_percentage: percentage,
        is_completed: is_completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "video_id, student_id" }
    );

    if (error) throw error;

    if (is_completed) {
      const { data: videoRow } = await supabase
        .from("lesson_videos")
        .select("lesson_id")
        .eq("id", video_id)
        .single();

      if (videoRow?.lesson_id) {
        const adminClient = await createAdminClient();
        const { data: lessonRow } = await supabase
          .from("lessons")
          .select("*, lesson_videos(*)")
          .eq("id", videoRow.lesson_id)
          .single();

        if (lessonRow) {
          const { data: videoCompletion } = await supabase
            .from("video_completion")
            .select("*")
            .eq("student_id", user.id)
            .in("video_id", lessonRow.lesson_videos?.map((v: { id: string }) => v.id) || []);

          const videos = {
            explanation: lessonRow.lesson_videos?.find((v: { video_type: string }) => v.video_type === "explanation"),
            try_solution: lessonRow.lesson_videos?.find((v: { video_type: string }) => v.video_type === "try_solution"),
            exercise_solution: lessonRow.lesson_videos?.find((v: { video_type: string }) => v.video_type === "exercise_solution"),
          };

          const [{ data: tryExercise }, { data: lessonExercise }, { data: progress }] = await Promise.all([
            supabase
              .from("exercises")
              .select("id")
              .eq("lesson_id", videoRow.lesson_id)
              .eq("kind", "try_practice")
              .eq("status", "published")
              .maybeSingle(),
            supabase
              .from("exercises")
              .select("id")
              .eq("lesson_id", videoRow.lesson_id)
              .eq("kind", "lesson_practice")
              .eq("status", "published")
              .maybeSingle(),
            supabase
              .from("lesson_progress")
              .select("*")
              .eq("student_id", user.id)
              .eq("lesson_id", videoRow.lesson_id)
              .maybeSingle(),
          ]);

          const flow = computeLessonFlow({
            lesson: lessonRow,
            hasExplanationVideo: Boolean(videos.explanation),
            hasTryActivity: Boolean(tryExercise),
            hasTryVideo: Boolean(videos.try_solution),
            hasExercise: Boolean(lessonExercise),
            hasExerciseVideo: Boolean(videos.exercise_solution),
            completedVideos: {
              explanation: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.explanation?.id)?.is_completed ?? false,
              try_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.try_solution?.id)?.is_completed ?? false,
              exercise_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.exercise_solution?.id)?.is_completed ?? false,
            },
            progress,
          });

          if (flow.isFullyComplete) {
            await finalizeLessonIfComplete(adminClient, user.id, lessonRow, flow);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
