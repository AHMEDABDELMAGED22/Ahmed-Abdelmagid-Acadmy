import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { formatPercent, formatScore } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: enrollments }, { data: progress }, { data: attempts }, { data: unlocked }] = await Promise.all([
    supabase.from("enrollments").select("*, courses(*)").eq("student_id", user!.id),
    supabase.from("course_progress").select("*").eq("student_id", user!.id).maybeSingle(),
    supabase.from("exercise_attempts").select("score, passed").eq("student_id", user!.id),
    supabase
      .from("lesson_progress")
      .select("*, lessons(lesson_code, title)")
      .eq("student_id", user!.id)
      .in("status", ["unlocked", "in_progress"])
      .limit(1)
      .maybeSingle(),
  ]);

  const course = Array.isArray(enrollments?.[0]?.courses)
    ? enrollments?.[0]?.courses[0]
    : enrollments?.[0]?.courses;
  const passedCount = attempts?.filter((attempt) => attempt.passed).length || 0;
  const averageScore = attempts?.length
    ? attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length
    : 0;

  return (
    <div className="space-y-8">
      <section className="academy-panel overflow-hidden rounded-lg">
        <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-medium text-cyan-200">Your instructor</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Ahmed Abdelmegid</h1>
            <p className="mt-2 text-slate-400">Software Engineer · Programming & Computer Science Instructor</p>
            <p className="mt-5 max-w-2xl text-slate-300">
              Follow the academy path one lesson at a time. Watch the video, pass the exercise,
              and unlock what comes next.
            </p>
          </div>
          <div className="relative min-h-60">
            <Image src="/images/ahmed-abdelmegid.jpg" alt="Ahmed Abdelmegid" fill className="object-cover" sizes="240px" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
              <BookOpenCheck className="h-4 w-4 text-cyan-300" />
              Course progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{formatPercent(progress?.progress_percentage || 0)}</p>
            <Progress value={progress?.progress_percentage || 0} className="mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Passed exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{passedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-400">
              <Trophy className="h-4 w-4 text-amber-300" />
              Average score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{formatScore(averageScore)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-200">Current course</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{course?.title || "Programming and Artificial Intelligence"}</h2>
            <p className="mt-1 text-sm text-slate-400">{course?.subtitle || "Introduction to ICT - First Year Secondary"}</p>
            {unlocked?.lessons && (
              <p className="mt-4 text-sm text-slate-300">
                Next lesson: {unlocked.lessons.lesson_code} {unlocked.lessons.title}
              </p>
            )}
          </div>
          <Link href="/student/course">
            <Button>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
