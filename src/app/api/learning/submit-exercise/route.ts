import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreAttempt } from "@/lib/learning/progression";

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, answers } = await request.json();
    if (!exerciseId || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "exerciseId and answers are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("*, questions(*, question_options(*))")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) throw exerciseError || new Error("Exercise not found.");

    const score = scoreAttempt({ questions: exercise.questions || [], answers });
    const passed = score >= Number(exercise.pass_score);

    const { data: previousAttempts } = await supabase
      .from("exercise_attempts")
      .select("attempt_number")
      .eq("student_id", user.id)
      .eq("exercise_id", exerciseId)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = (previousAttempts?.[0]?.attempt_number || 0) + 1;

    const { data: attempt, error: attemptError } = await supabase
      .from("exercise_attempts")
      .insert({
        student_id: user.id,
        exercise_id: exerciseId,
        course_id: exercise.course_id,
        chapter_id: exercise.chapter_id,
        lesson_id: exercise.lesson_id,
        attempt_number: attemptNumber,
        score,
        passed,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    const answerRows = (exercise.questions || []).map((question: {
      id: string;
      kind: string;
      correct_answer: string;
      explanation: string;
      question_options?: Array<{ id: string; option_text: string; is_correct: boolean }>;
    }) => {
      const answer = String(answers[question.id] || "");
      const correctOption = question.question_options?.find((option) => option.is_correct);
      const isCorrect =
        question.kind === "mcq"
          ? Boolean(correctOption && (answer === correctOption.id || answer.toLowerCase() === correctOption.option_text.toLowerCase()))
          : answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

      return {
        attempt_id: attempt.id,
        question_id: question.id,
        selected_option_id: question.kind === "mcq" ? answer : null,
        answer_text: question.kind === "mcq" ? null : answer,
        is_correct: isCorrect,
        feedback: isCorrect ? "Correct" : question.explanation,
      };
    });

    if (answerRows.length) {
      const { error: answersError } = await supabase.from("exercise_attempt_answers").insert(answerRows);
      if (answersError) throw answersError;
    }

    if (exercise.lesson_id) {
      const { data: existingProgress } = await supabase
        .from("lesson_progress")
        .select("video_completed, best_score")
        .eq("student_id", user.id)
        .eq("lesson_id", exercise.lesson_id)
        .maybeSingle();

      const videoCompleted = Boolean(existingProgress?.video_completed);
      const lessonCompleted = passed && videoCompleted;
      const bestScore = Math.max(Number(existingProgress?.best_score || 0), score);

      await supabase.from("lesson_progress").upsert(
        {
          student_id: user.id,
          course_id: exercise.course_id,
          chapter_id: exercise.chapter_id,
          lesson_id: exercise.lesson_id,
          status: lessonCompleted ? "completed" : "in_progress",
          video_completed: videoCompleted,
          exercise_passed: passed,
          best_score: bestScore,
          completed_at: lessonCompleted ? new Date().toISOString() : null,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "student_id,lesson_id" }
      );

      if (lessonCompleted) {
        const { data: currentLesson } = await supabase
          .from("lessons")
          .select("order_index")
          .eq("id", exercise.lesson_id)
          .single();

        const { data: nextLesson } = await supabase
          .from("lessons")
          .select("id, course_id, chapter_id")
          .eq("course_id", exercise.course_id)
          .gt("order_index", currentLesson?.order_index || 0)
          .order("order_index", { ascending: true })
          .limit(1)
          .single();

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

      const [{ count: totalLessons }, { count: completedLessons }, { count: totalChapters }] = await Promise.all([
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("course_id", exercise.course_id),
        supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("course_id", exercise.course_id)
          .eq("status", "completed"),
        supabase.from("chapters").select("*", { count: "exact", head: true }).eq("course_id", exercise.course_id),
      ]);

      const progressPercentage = totalLessons ? ((completedLessons || 0) / totalLessons) * 100 : 0;
      await supabase.from("course_progress").upsert(
        {
          student_id: user.id,
          course_id: exercise.course_id,
          lessons_completed: completedLessons || 0,
          lessons_total: totalLessons || 0,
          chapters_total: totalChapters || 0,
          average_score: score,
          progress_percentage: progressPercentage,
        },
        { onConflict: "student_id,course_id" }
      );
    }

    return NextResponse.json({ score, passed, attemptId: attempt.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit exercise." },
      { status: 500 }
    );
  }
}
