import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();
    if (!lessonId) return NextResponse.json({ error: "lessonId is required." }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, course_id, chapter_id")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) throw lessonError || new Error("Lesson not found.");

    const { data: passedAttempts } = await supabase
      .from("exercise_attempts")
      .select("score")
      .eq("student_id", user.id)
      .eq("lesson_id", lesson.id)
      .eq("passed", true)
      .order("score", { ascending: false })
      .limit(1);

    const exercisePassed = Boolean(passedAttempts?.length);
    const lessonCompleted = exercisePassed;

    const { error } = await supabase.from("lesson_progress").upsert(
      {
        student_id: user.id,
        course_id: lesson.course_id,
        chapter_id: lesson.chapter_id,
        lesson_id: lesson.id,
        status: lessonCompleted ? "completed" : "in_progress",
        video_completed: true,
        exercise_passed: exercisePassed,
        best_score: passedAttempts?.[0]?.score || null,
        completed_at: lessonCompleted ? new Date().toISOString() : null,
        started_at: new Date().toISOString(),
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" }
    );

    if (error) throw error;

    if (lessonCompleted) {
      const { data: currentLesson } = await supabase
        .from("lessons")
        .select("order_index")
        .eq("id", lesson.id)
        .single();

      const { data: nextLesson } = await supabase
        .from("lessons")
        .select("id, course_id, chapter_id")
        .eq("course_id", lesson.course_id)
        .gt("order_index", currentLesson?.order_index || 0)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextLesson) {
        await supabase.from("lesson_progress").upsert(
          {
            student_id: user.id,
            course_id: nextLesson.course_id,
            chapter_id: nextLesson.chapter_id,
            lesson_id: nextLesson.id,
            status: "unlocked",
            unlocked_at: new Date().toISOString(),
          },
          { onConflict: "student_id,lesson_id" }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update video progress." },
      { status: 500 }
    );
  }
}
