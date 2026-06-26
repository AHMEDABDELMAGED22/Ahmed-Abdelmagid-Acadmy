import Link from "next/link";
import { LockKeyhole, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function StudentCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("courses(*)")
    .eq("student_id", user!.id)
    .limit(1)
    .single();

  const course = Array.isArray(enrollment?.courses) ? enrollment?.courses[0] : enrollment?.courses;
  const [{ data: chapters }, { data: progress }] = await Promise.all([
    supabase
      .from("chapters")
      .select("*, lessons(*)")
      .eq("course_id", course?.id)
      .order("order_index")
      .order("order_index", { referencedTable: "lessons" }),
    supabase.from("lesson_progress").select("*").eq("student_id", user!.id).eq("course_id", course?.id),
  ]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Locked course path</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{course?.title}</h1>
        <p className="mt-2 text-slate-400">{course?.subtitle}</p>
      </div>

      <div className="space-y-5">
        {(chapters || []).map((chapter) => (
          <Card key={chapter.id}>
            <CardHeader>
              <CardTitle>Chapter {chapter.chapter_number}: {chapter.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(chapter.lessons || []).map((lesson: { id: string; lesson_code: string; title: string; order_index: number }) => {
                const item = progress?.find((p) => p.lesson_id === lesson.id);
                const unlocked = lesson.order_index === 1 || item?.status === "unlocked" || item?.status === "in_progress" || item?.status === "completed";
                const completed = item?.status === "completed";

                const content = (
                  <div className={`flex items-center justify-between rounded-lg border p-4 ${
                    unlocked ? "border-slate-700 bg-slate-950/40" : "border-slate-800 bg-slate-950/20 opacity-60"
                  }`}>
                    <div className="flex items-center gap-3">
                      {unlocked ? <PlayCircle className="h-5 w-5 text-cyan-300" /> : <LockKeyhole className="h-5 w-5 text-slate-600" />}
                      <div>
                        <p className="font-medium text-white">{lesson.lesson_code} {lesson.title}</p>
                        <p className="text-sm text-slate-500">{completed ? "Completed" : unlocked ? "Unlocked" : "Locked"}</p>
                      </div>
                    </div>
                    {completed && <Badge className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200">Done</Badge>}
                  </div>
                );

                return unlocked ? (
                  <Link key={lesson.id} href={`/student/lesson/${lesson.id}`}>{content}</Link>
                ) : (
                  <div key={lesson.id}>{content}</div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
