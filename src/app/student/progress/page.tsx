import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatPercent, formatScore } from "@/lib/utils";

export default async function StudentProgressPage() {
  const { t } = await getI18n();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: courseProgress }, { data: lessonProgress }, { data: attempts }] = await Promise.all([
    supabase.from("course_progress").select("*, courses(title)").eq("student_id", user!.id),
    supabase.from("lesson_progress").select("*, lessons(lesson_code, title)").eq("student_id", user!.id),
    supabase
      .from("exercise_attempts")
      .select("*, exercises(title)")
      .eq("student_id", user!.id)
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-200">Your progress</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Progress and attempts</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(courseProgress || []).map((item) => (
              <div key={item.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-white">{item.courses?.title}</span>
                  <span className="text-cyan-200">{formatPercent(item.percentage)}</span>
                </div>
                <Progress value={item.percentage} />
              </div>
            ))}
            {!courseProgress?.length && <p className="text-slate-400">Progress starts after your first lesson.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(lessonProgress || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-950/50 p-3 text-sm">
                <span className="text-slate-300">{item.lessons?.lesson_code} {item.lessons?.title}</span>
                <span className={item.status === "completed" ? "text-emerald-300" : "text-cyan-200"}>{item.status}</span>
              </div>
            ))}
            {!lessonProgress?.length && <p className="text-slate-400">No lessons started yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercise attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(attempts || []).map((attempt) => (
            <div key={attempt.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{attempt.exercises?.title}</p>
                <p className="text-sm text-slate-500">Attempt {attempt.attempt_number}</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="text-start md:text-end">
                  <p className={attempt.passed ? "text-emerald-300" : "text-rose-300"}>{attempt.passed ? "Passed" : "Retry"}</p>
                  <p className="font-semibold text-white">{formatScore(attempt.score)}</p>
                </div>
                <Link href={`/student/review/${attempt.id}`}>
                  <Button variant="secondary" size="sm" className="h-7 text-xs">
                    {t("review.title")}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {!attempts?.length && <p className="text-slate-400">No attempts submitted yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
