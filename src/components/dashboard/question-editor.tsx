"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";

export interface QuestionOption {
  id?: string;
  label: string;
  option_text: string;
  is_correct: boolean;
}

export interface Question {
  id?: string;
  kind: string;
  prompt: string;
  correct_answer: string;
  explanation: string;
  source_excerpt: string;
  question_options?: QuestionOption[];
}

export function QuestionEditor({
  question,
  exerciseId,
  index,
}: {
  question: Question;
  exerciseId: string;
  index: number;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Local state for editing
  const [prompt, setPrompt] = useState(question.prompt);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation);
  const [options, setOptions] = useState<QuestionOption[]>(
    question.question_options || [
      { label: "A", option_text: "", is_correct: true },
      { label: "B", option_text: "", is_correct: false },
      { label: "C", option_text: "", is_correct: false },
      { label: "D", option_text: "", is_correct: false },
    ]
  );

  async function handleSave() {
    setLoading(true);
    try {
      const endpoint = question.id
        ? `/api/instructor/questions/${question.id}/update`
        : `/api/instructor/questions/add`;

      const payload = {
        exercise_id: exerciseId,
        kind: question.kind,
        prompt,
        correct_answer: correctAnswer,
        explanation,
        source_excerpt: question.source_excerpt,
        options: question.kind === "mcq" ? options : undefined,
      };

      const res = await fetch(endpoint, {
        method: question.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      
      toast.success(t("question.save"));
      setEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!question.id) return;
    if (!confirm(t("question.confirm_delete"))) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/instructor/questions/${question.id}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast.success(t("question.delete"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  if (editing || !question.id) {
    return (
      <Card className="border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-cyan-200">
            {question.id ? `${t("question.edit")} Q${index + 1}` : t("question.add")}
            <span className="ml-2 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {question.kind.replace("_", " ")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
            />
          </div>

          {question.kind === "mcq" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct_${question.id || 'new'}`}
                    checked={opt.is_correct}
                    onChange={() =>
                      setOptions(options.map((o, idx) => ({ ...o, is_correct: i === idx })))
                    }
                  />
                  <span className="w-6 text-sm font-bold text-slate-500">{opt.label}</span>
                  <input
                    type="text"
                    value={opt.option_text}
                    onChange={(e) =>
                      setOptions(options.map((o, idx) => (i === idx ? { ...o, option_text: e.target.value } : o)))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                  />
                </div>
              ))}
            </div>
          )}

          {question.kind === "true_false" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">{t("question.correct_answer")}</label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
              >
                <option value="true">True / صح</option>
                <option value="false">False / خطأ</option>
              </select>
            </div>
          )}

          {(question.kind === "short_answer" || question.kind === "practical") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">{t("question.correct_answer")}</label>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="min-h-[60px] w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Explanation</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[60px] w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-500">
              <Check className="mr-2 h-4 w-4" /> {t("question.save")}
            </Button>
            {question.id && (
              <Button onClick={() => setEditing(false)} disabled={loading} variant="ghost" size="sm">
                <X className="mr-2 h-4 w-4" /> {t("question.cancel")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative">
      <div className="absolute right-4 top-4 hidden gap-2 group-hover:flex">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 text-slate-300" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-400" onClick={handleDelete} disabled={loading}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-cyan-200">Q{index + 1}</span>
          <span>{question.kind.replace("_", " ")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="pr-20 text-white">{question.prompt}</p>
        
        {question.question_options?.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {question.question_options.map((option) => (
              <div
                key={option.id || option.label}
                className={`rounded-lg border p-3 text-sm ${
                  option.is_correct
                    ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                    : "border-slate-700 bg-slate-950/50 text-slate-300"
                }`}
              >
                {option.label}. {option.option_text}
              </div>
            ))}
          </div>
        ) : null}
        
        <div className="rounded-lg bg-slate-950/70 p-4 text-sm">
          <p className="text-slate-300">
            <span className="text-slate-500">{t("question.correct_answer")}:</span> {question.correct_answer}
          </p>
          <p className="mt-2 text-slate-300">
            <span className="text-slate-500">Explanation:</span> {question.explanation}
          </p>
          <p className="mt-2 text-slate-500">Source idea: {question.source_excerpt}</p>
        </div>
      </CardContent>
    </Card>
  );
}
