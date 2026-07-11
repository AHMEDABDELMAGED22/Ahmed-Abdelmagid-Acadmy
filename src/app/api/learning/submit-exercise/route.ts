import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { evaluateSemanticAnswers } from "@/lib/ai/exercise-generator";

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
      .select("*, questions(*, question_options(*)), lessons(order_index)")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) throw exerciseError || new Error("Exercise not found.");

    const adminClient = await createAdminClient();

    // Step 1: Verify enrollment
    const { data: enrollment } = await adminClient
      .from('enrollments')
      .select('id, course_id')
      .eq('student_id', user.id)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in any course' }, { status: 403 });
    }

    // Since exercises might be at course level or lesson level, we check lessonId if it exists.
    const lessonId = exercise.lesson_id;
    if (lessonId) {
      // Step 2: Verify the lesson belongs to the enrolled course
      const { data: lessonCheck } = await adminClient
        .from('lessons')
        .select('id, order_index, chapter:chapters!inner(course_id)')
        .eq('id', lessonId)
        .eq('chapters.course_id', enrollment.course_id)
        .maybeSingle();

      if (!lessonCheck) {
        return NextResponse.json({ error: 'Lesson not found in your enrolled course' }, { status: 403 });
      }

      // Step 3: Verify the lesson is unlocked (first lesson is always accessible)
      if (lessonCheck.order_index !== 1) {
        const { data: progressCheck } = await adminClient
          .from('lesson_progress')
          .select('status')
          .eq('student_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        const allowedStatuses = ['unlocked', 'in_progress'];
        if (!progressCheck || !allowedStatuses.includes(progressCheck.status)) {
          return NextResponse.json({ error: 'Lesson is not unlocked' }, { status: 403 });
        }
      }
    }

    const semanticItems: Array<{ id: string; question: string; expected: string; studentAnswer: string }> = [];
    
    (exercise.questions || []).forEach((q: { id: string; kind: string; prompt: string; correct_answer: string }) => {
      const answer = String(answers[q.id] || "").trim();
      if ((q.kind === "short_answer" || q.kind === "practical") && answer) {
        semanticItems.push({
          id: q.id,
          question: q.prompt,
          expected: q.correct_answer,
          studentAnswer: answer,
        });
      }
    });

    const semanticResults = await evaluateSemanticAnswers(semanticItems);
    const semanticMap = new Map(semanticItems.map((item, i) => [item.id, semanticResults[i]]));

    let correctCount = 0;
    const pendingAnswerRows = (exercise.questions || []).map((question: { id: string; kind: string; correct_answer: string; explanation: string; question_options?: Array<{ id: string; is_correct: boolean; option_text: string }> }) => {
      const answer = String(answers[question.id] || "").trim();
      let isCorrect = false;

      if (question.kind === "mcq") {
        const correctOption = question.question_options?.find((opt) => opt.is_correct);
        isCorrect = Boolean(correctOption && (answer === correctOption.id || answer.toLowerCase() === correctOption.option_text.trim().toLowerCase()));
      } else if (question.kind === "true_false") {
        isCorrect = answer.toLowerCase() === question.correct_answer.trim().toLowerCase();
      } else {
        if (!answer) {
          isCorrect = false;
        } else if (answer.toLowerCase() === question.correct_answer.trim().toLowerCase()) {
          isCorrect = true;
        } else {
          isCorrect = Boolean(semanticMap.get(question.id));
        }
      }

      if (isCorrect) correctCount++;

      return {
        question_id: question.id,
        selected_option_id: question.kind === "mcq" ? (answers[question.id] || null) : null,
        answer_text: question.kind === "mcq" ? null : answer,
        is_correct: isCorrect,
        feedback: isCorrect ? "Correct" : question.explanation,
      };
    });

    const score = exercise.questions?.length ? (correctCount / exercise.questions.length) * 100 : 0;
    const passed = score >= Number(exercise.pass_score);

    const { data: previousAttempts } = await supabase
      .from("exercise_attempts")
      .select("attempt_number")
      .eq("student_id", user.id)
      .eq("exercise_id", exerciseId)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = (previousAttempts?.[0]?.attempt_number || 0) + 1;

    const { data: attempt, error: attemptError } = await adminClient
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

    const finalAnswerRows = pendingAnswerRows.map((row: Record<string, unknown>) => ({ ...row, attempt_id: attempt.id }));

    if (finalAnswerRows.length) {
      const { error: answersError } = await adminClient.from("exercise_attempt_answers").insert(finalAnswerRows);
      if (answersError) throw answersError;
    }

    if (exercise.lesson_id) {
      const { data: existingProgress } = await supabase
        .from("lesson_progress")
        .select("best_score, try_completed")
        .eq("student_id", user.id)
        .eq("lesson_id", exercise.lesson_id)
        .maybeSingle();

      const bestScore = Math.max(Number(existingProgress?.best_score || 0), score);

      await adminClient.from("lesson_progress").upsert(
        {
          student_id: user.id,
          course_id: exercise.course_id,
          chapter_id: exercise.chapter_id,
          lesson_id: exercise.lesson_id,
          status: "in_progress",
          exercise_passed: passed,
          exercise_completed: passed,
          best_score: bestScore,
          try_completed: existingProgress?.try_completed ?? undefined,
          started_at: existingProgress ? undefined : new Date().toISOString(),
          unlocked_at: existingProgress ? undefined : new Date().toISOString(),
        },
        { onConflict: "student_id,lesson_id" }
      );

      const { data: lessonRow } = await supabase
        .from("lessons")
        .select("*, lesson_videos(*)")
        .eq("id", exercise.lesson_id)
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

        const { data: tryExercise } = await supabase
          .from("exercises")
          .select("id")
          .eq("lesson_id", exercise.lesson_id)
          .eq("kind", "try_practice")
          .eq("status", "published")
          .maybeSingle();

        const { data: updatedProgress } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("student_id", user.id)
          .eq("lesson_id", exercise.lesson_id)
          .single();

        const { computeLessonFlow, finalizeLessonIfComplete } = await import("@/lib/learning/lesson-flow");
        const flow = computeLessonFlow({
          lesson: lessonRow,
          hasExplanationVideo: Boolean(videos.explanation),
          hasTryActivity: Boolean(tryExercise),
          hasTryVideo: Boolean(videos.try_solution),
          hasExercise: true,
          hasExerciseVideo: Boolean(videos.exercise_solution),
          completedVideos: {
            explanation: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.explanation?.id)?.is_completed ?? false,
            try_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.try_solution?.id)?.is_completed ?? false,
            exercise_solution: videoCompletion?.find((v: { video_id: string }) => v.video_id === videos.exercise_solution?.id)?.is_completed ?? false,
          },
          progress: updatedProgress,
        });

        if (flow.isFullyComplete) {
          await finalizeLessonIfComplete(adminClient, user.id, lessonRow, flow);
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
      await adminClient.from("course_progress").upsert(
        {
          student_id: user.id,
          course_id: exercise.course_id,
          completed_count: completedLessons || 0,
          total_lessons: totalLessons || 0,
          chapters_total: totalChapters || 0,
          average_score: score,
          percentage: progressPercentage,
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
