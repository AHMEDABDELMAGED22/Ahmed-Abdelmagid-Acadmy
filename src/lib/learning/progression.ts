import type { Exercise, Lesson, LessonProgress } from "@/lib/types";

export function isLessonUnlocked(lesson: Pick<Lesson, "order_index">, progress: LessonProgress[]) {
  if (lesson.order_index === 1) return true;
  const previous = progress.find((item) => item.status === "completed" && item.lesson_id);
  if (!previous) return false;
  const completedOrders = new Set(progress.filter((item) => item.status === "completed").map((item) => item.lesson_id));
  return completedOrders.size >= lesson.order_index - 1;
}

export function scoreAttempt({
  questions,
  answers,
}: {
  questions: Array<{
    id: string;
    kind: string;
    correct_answer: string;
    question_options?: Array<{ id: string; option_text: string; is_correct: boolean }>;
  }>;
  answers: Record<string, string>;
}) {
  if (questions.length === 0) return 0;

  let correct = 0;
  for (const question of questions) {
    const answer = (answers[question.id] || "").trim().toLowerCase();
    if (!answer) continue;

    if (question.kind === "mcq") {
      const correctOption = question.question_options?.find((option) => option.is_correct);
      if (
        correctOption &&
        (answer === correctOption.id.toLowerCase() ||
          answer === correctOption.option_text.trim().toLowerCase())
      ) {
        correct++;
      }
      continue;
    }

    if (question.kind === "true_false") {
      if (answer === question.correct_answer.trim().toLowerCase()) correct++;
      continue;
    }

    if (answer === question.correct_answer.trim().toLowerCase()) correct++;
  }

  return (correct / questions.length) * 100;
}

export function passedExercise(score: number, exercise: Pick<Exercise, "pass_score">) {
  return score >= exercise.pass_score;
}
