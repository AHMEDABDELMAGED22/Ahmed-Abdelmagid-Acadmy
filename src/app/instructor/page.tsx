import Image from "next/image";
import { BookOpen, ClipboardList, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { formatPercent, formatScore } from "@/lib/utils";

export default async function InstructorOverviewPage() {
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: courseCount },
    { count: exerciseCount },
    { data: attempts },
    { data: courseProgress },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("exercise_attempts").select("score, passed"),
    supabase.from("course_progress").select("percentage"),
  ]);

  const averageScore = attempts?.length
    ? attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) / attempts.length
    : 0;
  const averageProgress = courseProgress?.length
    ? courseProgress.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / courseProgress.length
    : 0;

  const stats = [
    { label: "Students", value: studentCount || 0, icon: Users, color: "text-cyan-300" },
    { label: "Courses", value: courseCount || 0, icon: BookOpen, color: "text-blue-300" },
    { label: "Exercises", value: exerciseCount || 0, icon: ClipboardList, color: "text-emerald-300" },
    { label: "Average score", value: formatScore(averageScore), icon: TrendingUp, color: "text-amber-300" },
  ];

  return (
    <div className="space-y-8">
      <section className="academy-panel overflow-hidden rounded-lg">
        <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-medium text-cyan-200">Instructor Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back, Ahmed.</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Manage your personal academy, review AI-generated exercises, track progress, and keep
              every student moving through the ICT curriculum with a clear path.
            </p>
            <div className="mt-8 max-w-xl">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-400">Average course progress</span>
                <span className="text-cyan-200">{formatPercent(averageProgress)}</span>
              </div>
              <Progress value={averageProgress} />
            </div>
          </div>
          <div className="relative min-h-64">
            <Image src="/images/ahmed-abdelmegid.jpg" alt="Ahmed Abdelmegid" fill className="object-cover" sizes="260px" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-slate-400">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
