import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function StudentReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const { t, direction } = await getI18n();
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("exercise_attempts")
    .select("*, exercises(title, lessons(title))")
    .eq("id", attemptId)
    .single();

  if (!attempt) notFound();

  const { data: answers } = await supabase
    .from("exercise_attempt_answers")
    .select("*, questions(*), question_options(option_text)")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  const totalQuestions = answers?.length || 0;
  const correctCount = answers?.filter((a) => a.is_correct).length || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/progress">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-900/50 hover:bg-slate-800">
            {direction === "rtl" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-white">{t("review.back")}</h1>
      </div>

      <div className="academy-panel rounded-lg p-6">
        <p className="text-sm font-medium text-cyan-200">{attempt.exercises?.lessons?.title}</p>
        <h2 className="mt-1 text-2xl font-bold text-white">{attempt.exercises?.title}</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <p>{t("review.score")}: <span className="font-semibold text-white">{correctCount} / {totalQuestions}</span></p>
          <p>&bull;</p>
          <p>{new Date(attempt.submitted_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {(answers || []).map((answer, index) => (
          <Card key={answer.id}>
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  {answer.is_correct ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="font-medium text-white">
                    <span className="mr-2 text-slate-500">{index + 1}.</span>
                    {answer.questions?.prompt}
                  </p>

                  <div className={`rounded-lg border p-3 ${answer.is_correct ? "border-emerald-900/50 bg-emerald-950/20" : "border-rose-900/50 bg-rose-950/20"}`}>
                    <p className={`text-xs font-medium ${answer.is_correct ? "text-emerald-500" : "text-rose-500"}`}>
                      {t("review.your_answer")}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      {answer.question_options?.option_text || answer.answer_text || "—"}
                    </p>
                  </div>

                  {!answer.is_correct && (
                    <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-3">
                      <p className="text-xs font-medium text-blue-400">{t("review.correct_answer")}</p>
                      <p className="mt-1 text-sm text-slate-200">{answer.questions?.correct_answer}</p>
                    </div>
                  )}

                  {answer.feedback && answer.feedback !== "Correct" && (
                    <div className="rounded-lg bg-slate-900/50 p-3">
                      <p className="text-xs font-medium text-slate-400">{t("review.ai_feedback")}</p>
                      <p className="mt-1 text-sm text-slate-300">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
