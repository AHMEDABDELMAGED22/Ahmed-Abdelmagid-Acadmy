import { NextRequest, NextResponse } from "next/server";
import { generateExerciseQuestions } from "@/lib/ai/exercise-generator";
import { createClient } from "@/lib/supabase/server";

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

    const body = await request.json();
    const { lessonId, language = "english" } = body;

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
    }

    const [{ data: content }, { data: lesson }] = await Promise.all([
      supabase.from("lesson_content").select("try_content").eq("lesson_id", lessonId).maybeSingle(),
      supabase.from("lessons").select("id, course_id, chapter_id, title").eq("id", lessonId).single(),
    ]);

    if (!content?.try_content?.trim()) {
      return NextResponse.json({ error: "Try content is missing. Extract it from the PDF first." }, { status: 400 });
    }

    if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

    const tryContext = `TRY ACTIVITY FROM TEXTBOOK:\n${content.try_content}\n\nLESSON TOPIC:\n${lesson.title}`;
    const questions = await generateExerciseQuestions(
      {
        lessonContext: tryContext,
        language,
        kind: "lesson_practice",
        counts: { mcq: 3, true_false: 1, short_answer: 0, practical: 0 },
      },
      { minQuestions: 3 }
    );

    await supabase.from("exercises").delete().eq("lesson_id", lessonId).eq("kind", "try_practice");

    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .insert({
        course_id: lesson.course_id,
        chapter_id: lesson.chapter_id,
        lesson_id: lessonId,
        kind: "try_practice",
        title: `Try - ${lesson.title}`,
        language,
        status: "published",
        pass_score: 0,
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
          language,
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

    return NextResponse.json({ exerciseId: exercise.id, questionCount: questions.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Try generation failed." },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
