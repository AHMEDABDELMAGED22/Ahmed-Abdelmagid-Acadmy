import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseForm } from "@/components/learning/exercise-form";
import { VideoPlayer } from "@/components/learning/video-player";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, chapters(chapter_number, title), lesson_videos(*), exercises(*, questions(*, question_options(*)))")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", user!.id)
    .eq("lesson_id", id)
    .maybeSingle();

  if (lesson.order_index !== 1 && !progress) redirect("/student/course");

  const exercise = (lesson.exercises || []).find((item: { status: string; kind: string }) => item.status === "published" && item.kind === "lesson_practice");
  const video = lesson.lesson_videos?.[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <main className="space-y-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>Chapter {lesson.chapters?.chapter_number}</Badge>
            <Badge className="border-blue-300/25 bg-blue-300/10 text-blue-200">{lesson.lesson_code}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{lesson.title}</h1>
          <p className="mt-2 text-slate-400">
            Watch the video, then pass the lesson exercise to unlock the next lesson.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lesson video</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayer lessonId={lesson.id} embedUrl={video?.embed_url || null} completed={Boolean(progress?.video_completed)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            {exercise ? (
              <ExerciseForm exercise={exercise} questions={exercise.questions || []} />
            ) : (
              <p className="text-slate-400">This lesson exercise has not been published yet.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Unlock checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Video completed</span>
              <span className={progress?.video_completed ? "text-emerald-300" : "text-slate-500"}>
                {progress?.video_completed ? "Done" : "Required"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Exercise passed</span>
              <span className={progress?.exercise_passed ? "text-emerald-300" : "text-slate-500"}>
                {progress?.exercise_passed ? "Done" : "Required"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Best score</span>
              <span className="text-cyan-200">{progress?.best_score ? `${Math.round(progress.best_score)}%` : "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              PDF pages {lesson.source_page_start}-{lesson.source_page_end}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Exercises should be generated from this lesson’s official PDF content only.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
