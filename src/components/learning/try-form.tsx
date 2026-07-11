"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import type { Exercise, Question, QuestionOption } from "@/lib/types";

type QuestionWithOptions = Question & { question_options?: QuestionOption[] };

export function TryForm({
  exercise,
  questions,
  completed,
}: {
  exercise: Exercise;
  questions: QuestionWithOptions[];
  completed: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(completed);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  async function submit() {
    const unanswered = questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      toast.error("Please answer all Try questions before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/learning/submit-try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResults(data.results || {});
      setSubmitted(true);
      toast.success("Try activity submitted! Try Solution Video is now unlocked.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit Try activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="p-5">
            <p className="mb-4 text-sm text-cyan-200">
              Question {index + 1} · {question.kind.replace("_", " ")}
            </p>
            <p className="text-white">{question.prompt}</p>
            {question.kind === "mcq" && question.question_options?.length ? (
              <div className="mt-4 grid gap-2">
                {question.question_options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:border-cyan-300/35 ${
                      submitted && results[question.id] !== undefined
                        ? option.is_correct
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
                          : answers[question.id] === option.id
                            ? "border-rose-500/40 bg-rose-950/30 text-rose-100"
                            : "border-slate-800 bg-slate-950/50 text-slate-300"
                        : "border-slate-800 bg-slate-950/50 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      disabled={submitted}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                      className="mt-1"
                    />
                    <span>
                      {option.label}. {option.option_text}
                    </span>
                  </label>
                ))}
              </div>
            ) : question.kind === "true_false" ? (
              <div className="mt-4 flex gap-3">
                {[
                  { value: "true", label: t("exercise.trueLabel") },
                  { value: "false", label: t("exercise.falseLabel") },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 ${
                      submitted && results[question.id] !== undefined
                        ? value === question.correct_answer.toLowerCase()
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
                          : answers[question.id] === value
                            ? "border-rose-500/40 bg-rose-950/30 text-rose-100"
                            : "border-slate-800 text-slate-300"
                        : "border-slate-800 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={answers[question.id] === value}
                      disabled={submitted}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            ) : null}
            {submitted && (
              <div className="mt-4 rounded-lg bg-slate-950/70 p-3 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">{t("exercise.explanation")}:</span> {question.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!submitted && (
        <Button onClick={submit} disabled={submitting || questions.length === 0}>
          {submitting ? "Submitting..." : "Submit Try"}
        </Button>
      )}
    </div>
  );
}
