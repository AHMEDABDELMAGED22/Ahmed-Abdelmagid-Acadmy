import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*, lessons(lesson_code, title), chapters(chapter_number, title), questions(id)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Review before publishing</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Exercises</h1>
        <p className="mt-2 text-slate-400">
          AI-generated questions stay as drafts until you approve them.
        </p>
      </div>

      <div className="grid gap-4">
        {(exercises || []).map((exercise) => (
          <Link href={`/instructor/exercises/${exercise.id}`} key={exercise.id}>
            <Card className="transition-colors hover:border-cyan-300/35">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">{exercise.title}</h2>
                      <Badge>{exercise.status}</Badge>
                      <Badge className="border-blue-300/25 bg-blue-300/10 text-blue-200">{exercise.language}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {exercise.lessons
                        ? `${exercise.lessons.lesson_code} ${exercise.lessons.title}`
                        : `Chapter ${exercise.chapters?.chapter_number}: ${exercise.chapters?.title}`}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{exercise.questions?.length || 0} questions</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!exercises?.length && (
          <Card>
            <CardContent className="p-6 text-slate-400">No exercises generated yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
