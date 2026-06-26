import { NextRequest, NextResponse } from "next/server";
import { generateExerciseQuestions } from "@/lib/ai/exercise-generator";
import { createClient } from "@/lib/supabase/server";
import type { GenerateExerciseRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as GenerateExerciseRequest;
    const questions = await generateExerciseQuestions(body);

    const { data: scope, error: scopeError } = body.lessonId
      ? await supabase
          .from("lessons")
          .select("id, course_id, chapter_id, title")
          .eq("id", body.lessonId)
          .single()
      : await supabase
          .from("chapters")
          .select("id, course_id, title")
          .eq("id", body.chapterId)
          .single();

    if (scopeError || !scope) throw scopeError || new Error("Unable to load exercise scope.");

    const courseId = "chapter_id" in scope ? scope.course_id : scope.course_id;
    const chapterId = "chapter_id" in scope ? scope.chapter_id : scope.id;
    const lessonId = "chapter_id" in scope ? scope.id : null;

    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .insert({
        course_id: courseId,
        chapter_id: chapterId,
        lesson_id: lessonId,
        kind: body.kind,
        title: body.title || `${body.kind === "chapter_exam" ? "Chapter Exam" : "Lesson Exercise"} - ${scope.title}`,
        language: body.language,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const { data: insertedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          exercise_id: exercise.id,
          kind: question.kind,
          prompt: question.prompt,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          source_excerpt: question.source_excerpt,
          language: body.language,
          order_index: index,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      if (question.options?.length) {
        const { error: optionsError } = await supabase.from("question_options").insert(
          question.options.map((option, optionIndex) => ({
            question_id: insertedQuestion.id,
            label: option.label,
            option_text: option.text,
            is_correct: option.is_correct,
            order_index: optionIndex,
          }))
        );
        if (optionsError) throw optionsError;
      }
    }

    await supabase.from("ai_generation_history").insert({
      requested_by: user.id,
      input: body,
      output: questions,
    });

    return NextResponse.json({ exerciseId: exercise.id, questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Exercise generation failed." },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
