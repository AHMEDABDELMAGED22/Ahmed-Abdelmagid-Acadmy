import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
      .eq("kind", "try_practice")
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json({ error: "Try activity not found." }, { status: 404 });
    }

    const adminClient = await createAdminClient();
    const questions = exercise.questions || [];
    const results: Record<string, boolean> = {};

    for (const question of questions) {
      const answer = String(answers[question.id] || "").trim();
      let isCorrect = false;

      if (question.kind === "mcq") {
        const correctOption = question.question_options?.find((opt: { is_correct: boolean }) => opt.is_correct);
        isCorrect = Boolean(correctOption && answer === correctOption.id);
      } else if (question.kind === "true_false") {
        isCorrect = answer.toLowerCase() === question.correct_answer.trim().toLowerCase();
      }

      results[question.id] = isCorrect;
    }

    const unanswered = questions.filter((q: { id: string }) => !String(answers[q.id] || "").trim());
    if (unanswered.length > 0) {
      return NextResponse.json({ error: "Please answer all Try questions." }, { status: 400 });
    }

    if (exercise.lesson_id) {
      await adminClient.from("lesson_progress").upsert(
        {
          student_id: user.id,
          course_id: exercise.course_id,
          chapter_id: exercise.chapter_id,
          lesson_id: exercise.lesson_id,
          try_completed: true,
          status: "in_progress",
          started_at: new Date().toISOString(),
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "student_id,lesson_id" }
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit Try activity." },
      { status: 500 }
    );
  }
}
