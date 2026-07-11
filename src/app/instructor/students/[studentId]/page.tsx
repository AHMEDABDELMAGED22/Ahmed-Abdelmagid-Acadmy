import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { formatPercent, formatScore } from "@/lib/utils";

export default async function InstructorStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const [{ data: courseProgress }, { data: lessonProgress }, { data: attempts }] = await Promise.all([
    supabase.from("course_progress").select("*, courses(title)").eq("student_id", studentId),
    supabase.from("lesson_progress").select("*, lessons(lesson_code, title)").eq("student_id", studentId),
    supabase
      .from("exercise_attempts")
      .select("*, exercises(title)")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/instructor/students">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-900/50 hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <p className="text-sm font-medium text-cyan-200">Student Details</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{student.full_name}</h1>
        </div>
      </div>
      
      <p className="text-slate-400">{student.email}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
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
            {!courseProgress?.length && <p className="text-slate-400">No course progress yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Lessons</CardTitle>
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
          <CardTitle>Exercise Attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(attempts || []).map((attempt) => (
            <div key={attempt.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{attempt.exercises?.title}</p>
                <p className="text-sm text-slate-500">Attempt {attempt.attempt_number} • {new Date(attempt.submitted_at).toLocaleDateString()}</p>
              </div>
              <div className="text-start md:text-end">
                <p className={attempt.passed ? "text-emerald-300" : "text-rose-300"}>{attempt.passed ? "Passed" : "Failed"}</p>
                <p className="font-semibold text-white">{formatScore(attempt.score)}</p>
              </div>
            </div>
          ))}
          {!attempts?.length && <p className="text-slate-400">No attempts submitted yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
