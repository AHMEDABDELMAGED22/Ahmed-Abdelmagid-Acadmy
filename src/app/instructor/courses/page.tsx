import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*, chapters(id), lessons(id)")
    .order("order_index");

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Curriculum</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Courses</h1>
        <p className="mt-2 text-slate-400">Manage the academy course structure from chapters to lessons.</p>
      </div>

      <div className="grid gap-4">
        {(courses || []).map((course) => (
          <Link key={course.id} href={`/instructor/courses/${course.id}`}>
            <Card className="transition-colors hover:border-cyan-300/35">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">{course.title}</h2>
                      <Badge>{course.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{course.subtitle}</p>
                    <p className="mt-3 text-sm text-slate-500">
                      {course.chapters?.length || 0} chapters · {course.lessons?.length || 0} lessons
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
