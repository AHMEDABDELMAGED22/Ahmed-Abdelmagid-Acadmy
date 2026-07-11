import { Card, CardContent } from "@/components/ui/card";
import { StudentAttemptReview } from "@/components/dashboard/student-attempt-review";
import { createClient } from "@/lib/supabase/server";
import { formatScore } from "@/lib/utils";

export default async function InstructorResultsPage() {
  const supabase = await createClient();
  const { data: attempts } = await supabase
    .from("exercise_attempts")
    .select("*, profiles(full_name, email), exercises(title, kind)")
    .order("submitted_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Assessment History</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Results</h1>
        <p className="mt-2 text-slate-400">Track scores, retries, mistakes, and improvement over time.</p>
      </div>

      <div className="grid gap-3">
        {(attempts || []).map((attempt) => (
          <Card key={attempt.id}>
            <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-white">{attempt.profiles?.full_name}</p>
                <p className="mt-1 text-sm text-slate-400">{attempt.exercises?.title}</p>
                <p className="mt-1 text-xs text-slate-500">Attempt {attempt.attempt_number}</p>
              </div>
              <div className="text-start md:text-end">
                <p className={attempt.passed ? "text-emerald-300" : "text-rose-300"}>
                  {attempt.passed ? "Passed" : "Retry needed"}
                </p>
                <p className="text-2xl font-semibold text-white">{formatScore(attempt.score)}</p>
              </div>
            </CardContent>
            <div className="px-5 pb-5">
              <StudentAttemptReview attempt={attempt} />
            </div>
          </Card>
        ))}
        {!attempts?.length && (
          <Card>
            <CardContent className="p-6 text-slate-400">No submitted attempts yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
