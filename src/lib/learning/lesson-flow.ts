import type { SupabaseClient } from "@supabase/supabase-js";

export interface LessonFlowInput {
  lesson: {
    id: string;
    course_id: string;
    chapter_id: string;
    order_index: number;
    explanation_video_required: boolean;
    try_required: boolean;
    try_video_required: boolean;
    exercise_required: boolean;
    exercise_video_required: boolean;
  };
  hasExplanationVideo: boolean;
  hasTryActivity: boolean;
  hasTryVideo: boolean;
  hasExercise: boolean;
  hasExerciseVideo: boolean;
  completedVideos: {
    explanation: boolean;
    try_solution: boolean;
    exercise_solution: boolean;
  };
  progress?: {
    try_completed?: boolean;
    exercise_passed?: boolean;
    unlocked?: boolean;
    status?: string;
  } | null;
}

export interface LessonFlowState {
  explanationDone: boolean;
  tryDone: boolean;
  tryVideoDone: boolean;
  exerciseDone: boolean;
  exerciseVideoDone: boolean;
  pointLocked: boolean;
  tryLocked: boolean;
  tryVideoLocked: boolean;
  exerciseLocked: boolean;
  exerciseVideoLocked: boolean;
  isFullyComplete: boolean;
}

export function computeLessonFlow(input: LessonFlowInput): LessonFlowState {
  const {
    lesson,
    hasExplanationVideo,
    hasTryActivity,
    hasTryVideo,
    hasExercise,
    hasExerciseVideo,
    completedVideos,
    progress,
  } = input;

  const explanationApplies = hasExplanationVideo && lesson.explanation_video_required;
  const explanationDone = !explanationApplies || completedVideos.explanation;

  const tryApplies = hasTryActivity && lesson.try_required;
  const tryDone = !tryApplies || Boolean(progress?.try_completed);

  const tryVideoApplies = hasTryVideo && lesson.try_video_required;
  const tryVideoDone = !tryVideoApplies || completedVideos.try_solution;

  const exerciseApplies = hasExercise && lesson.exercise_required;
  const exerciseDone = !exerciseApplies || Boolean(progress?.exercise_passed);

  const exerciseVideoApplies = hasExerciseVideo && lesson.exercise_video_required;
  const exerciseVideoDone = !exerciseVideoApplies || completedVideos.exercise_solution;

  const pointLocked = !explanationDone;
  const tryLocked = pointLocked;
  const tryVideoLocked = tryLocked || !tryDone;
  const exerciseLocked = tryVideoLocked || !tryVideoDone;
  const exerciseVideoLocked = exerciseLocked || !exerciseDone;
  const isFullyComplete =
    explanationDone && tryDone && tryVideoDone && exerciseDone && exerciseVideoDone;

  return {
    explanationDone,
    tryDone,
    tryVideoDone,
    exerciseDone,
    exerciseVideoDone,
    pointLocked,
    tryLocked,
    tryVideoLocked,
    exerciseLocked,
    exerciseVideoLocked,
    isFullyComplete,
  };
}

export async function finalizeLessonIfComplete(
  adminClient: SupabaseClient,
  studentId: string,
  lesson: LessonFlowInput["lesson"],
  flow: Pick<LessonFlowState, "isFullyComplete">
) {
  if (!flow.isFullyComplete) return;

  const now = new Date().toISOString();

  await adminClient.from("lesson_progress").upsert(
    {
      student_id: studentId,
      course_id: lesson.course_id,
      chapter_id: lesson.chapter_id,
      lesson_id: lesson.id,
      status: "completed",
      unlocked: true,
      completed_at: now,
    },
    { onConflict: "student_id,lesson_id" }
  );

  const { data: nextLesson } = await adminClient
    .from("lessons")
    .select("id, course_id, chapter_id")
    .eq("course_id", lesson.course_id)
    .gt("order_index", lesson.order_index)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextLesson) {
    await adminClient.from("lesson_progress").upsert(
      {
        student_id: studentId,
        course_id: nextLesson.course_id,
        chapter_id: nextLesson.chapter_id,
        lesson_id: nextLesson.id,
        status: "unlocked",
        unlocked_at: now,
      },
      { onConflict: "student_id,lesson_id" }
    );
  }
}
