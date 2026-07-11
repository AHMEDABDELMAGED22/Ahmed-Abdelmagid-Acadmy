"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getAttemptAnswers } from "@/app/instructor/actions";

interface AttemptDetail {
  id: string;
  is_correct: boolean;
  answer_text: string | null;
  feedback: string | null;
  questions: {
    prompt: string;
    correct_answer: string;
  } | null;
  question_options: {
    option_text: string;
  }[] | null;
}

export function StudentAttemptReview({ attempt }: { attempt: { id: string; [key: string]: unknown } }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<AttemptDetail[]>([]);

  async function loadAnswers() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (details.length > 0) return;

    setLoading(true);
    try {
      const data = await getAttemptAnswers(attempt.id);
      setDetails(data as unknown as AttemptDetail[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 w-full border-t border-slate-800 pt-4">
      <Button variant="ghost" size="sm" onClick={loadAnswers} className="w-full justify-between">
        {open ? "Hide Details" : "Review Details"}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="mt-4 space-y-4">
          {loading && <p className="text-sm text-slate-400">Loading answers...</p>}
          {details.map((detail, index) => (
            <div key={detail.id} className="rounded-lg bg-slate-950/50 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  {detail.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-300">Question {index + 1}</p>
                  <p className="mt-1 font-medium text-white">{detail.questions?.prompt}</p>
                  
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-700 bg-slate-900/50 p-3">
                      <p className="text-xs text-slate-500">Student&apos;s Answer</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {detail.answer_text || (detail.question_options && detail.question_options[0] ? detail.question_options[0].option_text : "No answer provided")}
                      </p>
                    </div>
                    <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 p-3">
                      <p className="text-xs text-emerald-500/70">Correct Answer</p>
                      <p className="mt-1 text-sm text-emerald-400">{detail.questions?.correct_answer}</p>
                    </div>
                  </div>
                  
                  {detail.feedback && detail.feedback !== "Correct" && (
                    <p className="mt-3 text-sm text-slate-400">
                      <span className="font-semibold text-slate-500">AI Feedback:</span> {detail.feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
