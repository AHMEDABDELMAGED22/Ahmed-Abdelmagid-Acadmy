import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseForm } from "@/components/learning/exercise-form";
import { TryForm } from "@/components/learning/try-form";
import { VideoPlayer } from "@/components/learning/video-player";
import { LessonStepContainer } from "@/components/learning/lesson-step-container";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { computeLessonFlow, finalizeLessonIfComplete } from "@/lib/learning/lesson-flow";

export default async function StudentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, chapters(chapter_number, title), lesson_content(*), lesson_videos(*), exercises(*, questions(*, question_options(*)))")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", user!.id)
    .eq("lesson_id", id)
    .maybeSingle();

  const { data: videoCompletion } = await supabase
    .from("video_completion")
    .select("*")
    .eq("student_id", user!.id)
    .in("video_id", lesson.lesson_videos?.map((v: { id: string }) => v.id) || []);

  if (lesson.order_index !== 1 && (!progress || progress.status === "locked")) {
    redirect("/student/course");
  }

  const tryExercise = (lesson.exercises || []).find(
    (item: { status: string; kind: string }) => item.status === "published" && item.kind === "try_practice"
  );
  const exercise = (lesson.exercises || []).find(
    (item: { status: string; kind: string }) => item.status === "published" && item.kind === "lesson_practice"
  );
  const content = lesson.lesson_content?.[0];

  const videos = {
    explanation: lesson.lesson_videos?.find((v: { video_type: string }) => v.video_type === "explanation"),
    try_solution: lesson.lesson_videos?.find((v: { video_type: string }) => v.video_type === "try_solution"),
    exercise_solution: lesson.lesson_videos?.find((v: { video_type: string }) => v.video_type === "exercise_solution"),
  };

  const completedVideos = {
    explanation: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.explanation?.id)?.is_completed ?? false,
    try_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.try_solution?.id)?.is_completed ?? false,
    exercise_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.exercise_solution?.id)?.is_completed ?? false,
  };

  const hasTryActivity = Boolean(tryExercise?.questions?.length);
  const flow = computeLessonFlow({
    lesson,
    hasExplanationVideo: Boolean(videos.explanation),
    hasTryActivity,
    hasTryVideo: Boolean(videos.try_solution),
    hasExercise: Boolean(exercise),
    hasExerciseVideo: Boolean(videos.exercise_solution),
    completedVideos,
    progress,
  });

  if (flow.isFullyComplete) {
    const adminClient = await createAdminClient();
    await finalizeLessonIfComplete(adminClient, user!.id, lesson, flow);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <main className="space-y-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>Chapter {lesson.chapters?.chapter_number}</Badge>
            <Badge className="border-blue-300/25 bg-blue-300/10 text-blue-200">{lesson.lesson_code}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{lesson.title}</h1>
        </div>

        {videos.explanation && (
          <LessonStepContainer
            title="1. Explanation Video"
            isLocked={false}
            isCompleted={completedVideos.explanation}
            isRequired={lesson.explanation_video_required}
            lessonId={lesson.id}
          >
            <VideoPlayer
              videoId={videos.explanation.id}
              embedUrl={videos.explanation.embed_url}
              provider={videos.explanation.provider}
              completed={completedVideos.explanation}
            />
          </LessonStepContainer>
        )}

        {content?.point_content && (
          <Card className={`transition-all ${flow.pointLocked ? "pointer-events-none opacity-50" : ""}`}>
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <span className="text-2xl">📘</span>
              <CardTitle className="text-xl text-white">Point!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm leading-relaxed text-slate-200">
                {content.point_content}
              </div>
            </CardContent>
          </Card>
        )}

        {hasTryActivity && tryExercise && (
          <div className={`rounded-xl border p-6 transition-all ${flow.tryLocked ? "pointer-events-none border-slate-800 bg-slate-900/20 opacity-75" : progress?.try_completed ? "border-emerald-500/30 bg-slate-950/50" : "border-slate-700 bg-slate-950"}`}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span className="text-2xl">📌</span>
                3. Try
                {lesson.try_required && !progress?.try_completed && (
                  <span className="ml-2 rounded-full bg-slate-800 px-2 py-1 text-xs font-normal text-slate-300">Required</span>
                )}
                {progress?.try_completed && (
                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-normal text-emerald-300">Completed</span>
                )}
              </h3>
            </div>
            <div className={flow.tryLocked ? "pointer-events-none blur-sm select-none" : ""}>
              <TryForm
                exercise={tryExercise}
                questions={tryExercise.questions || []}
                completed={Boolean(progress?.try_completed)}
              />
            </div>
          </div>
        )}

        {videos.try_solution && (
          <LessonStepContainer
            title="4. Try Solution Video"
            isLocked={flow.tryVideoLocked}
            isCompleted={completedVideos.try_solution}
            isRequired={lesson.try_video_required}
            lessonId={lesson.id}
          >
            <VideoPlayer
              videoId={videos.try_solution.id}
              embedUrl={videos.try_solution.embed_url}
              provider={videos.try_solution.provider}
              completed={completedVideos.try_solution}
            />
          </LessonStepContainer>
        )}

        {content?.exercise_content && (
          <Card className={`transition-all ${flow.exerciseLocked ? "pointer-events-none opacity-50" : ""}`}>
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <span className="text-2xl">📝</span>
              <CardTitle className="text-xl text-white">Exercise</CardTitle>
              <span className="ml-auto rounded-full bg-slate-800 px-2 py-1 text-xs font-normal text-slate-400">Textbook Context</span>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-sm leading-relaxed text-slate-300">
                {content.exercise_content}
              </div>
            </CardContent>
          </Card>
        )}

        {exercise && (
          <LessonStepContainer
            title="6. Interactive Exercise"
            isLocked={flow.exerciseLocked}
            isCompleted={progress?.exercise_passed}
            isRequired={lesson.exercise_required}
            lessonId={lesson.id}
          >
            <ExerciseForm exercise={exercise} questions={exercise.questions || []} />
          </LessonStepContainer>
        )}

        {videos.exercise_solution && (
          <LessonStepContainer
            title="7. Exercise Solution Video"
            isLocked={flow.exerciseVideoLocked}
            isCompleted={completedVideos.exercise_solution}
            isRequired={lesson.exercise_video_required}
            lessonId={lesson.id}
          >
            <VideoPlayer
              videoId={videos.exercise_solution.id}
              embedUrl={videos.exercise_solution.embed_url}
              provider={videos.exercise_solution.provider}
              completed={completedVideos.exercise_solution}
            />
          </LessonStepContainer>
        )}
      </main>

      <aside className="space-y-4">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Lesson Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <Badge className={flow.isFullyComplete ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-300"}>
                {flow.isFullyComplete ? "Completed" : "In Progress"}
              </Badge>
            </div>
            {progress?.best_score !== null && progress?.best_score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Exercise Score</span>
                <span className="text-cyan-300">{progress.best_score}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
