"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import type { Exercise, Question, QuestionOption } from "@/lib/types";

type QuestionWithOptions = Question & { question_options?: QuestionOption[] };

export function ExerciseForm({
  exercise,
  questions,
}: {
  exercise: Exercise;
  questions: QuestionWithOptions[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();
  const router = useRouter();

  async function submit() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/learning/submit-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult({ score: data.score, passed: data.passed });
      toast.success(data.passed ? t("exercise.passedToast") : t("exercise.retryToast"));
      if (data.passed) router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("exercise.failedSubmit"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="p-5">
            <p className="mb-4 text-sm text-cyan-200">Question {index + 1} · {question.kind.replace("_", " ")}</p>
            <p className="text-white">{question.prompt}</p>
            {question.kind === "mcq" && question.question_options?.length ? (
              <div className="mt-4 grid gap-2">
                {question.question_options.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300 hover:border-cyan-300/35">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                      className="mt-1"
                    />
                    <span>{option.label}. {option.option_text}</span>
                  </label>
                ))}
              </div>
                    ) : question.kind === "true_false" ? (
              <div className="mt-4 flex gap-3">
                {[
                  { value: "true", label: t("exercise.trueLabel") },
                  { value: "false", label: t("exercise.falseLabel") },
                ].map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-slate-300">
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={answers[question.id] === value}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            ) : null}
            {result && (
              <div className="mt-4 rounded-lg bg-slate-950/70 p-3 text-sm text-slate-300">
                <p><span className="text-slate-500">{t("exercise.correctAnswer")}:</span> {question.correct_answer}</p>
                <p className="mt-1"><span className="text-slate-500">{t("exercise.explanation")}:</span> {question.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {result && (
        <div className={`rounded-lg border p-4 ${result.passed ? "border-emerald-300/30 bg-emerald-300/10" : "border-rose-300/30 bg-rose-300/10"}`}>
          <p className="font-semibold text-white">Score: {Math.round(result.score)}%</p>
          <p className="mt-1 text-sm text-slate-300">
            {result.passed ? t("exercise.passedMsg") : t("exercise.retryMsg")}
          </p>
        </div>
      )}

      <Button onClick={submit} disabled={submitting || questions.length === 0}>
        {submitting ? t("exercise.submitting") : result?.passed ? t("exercise.submitAnother") : t("exercise.submit")}
      </Button>
    </div>
  );
}
