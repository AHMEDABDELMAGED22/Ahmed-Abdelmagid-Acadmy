import { saveLessonVideo } from "@/app/instructor/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerateExercisePanel } from "@/components/learning/generate-exercise-panel";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: course }, { data: chapters }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).single(),
    supabase
      .from("chapters")
      .select("*, lessons(*, lesson_videos(*), exercises(*))")
      .eq("course_id", id)
      .order("order_index")
      .order("order_index", { referencedTable: "lessons" }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Course Management</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{course?.title}</h1>
        <p className="mt-2 text-slate-400">{course?.subtitle}</p>
      </div>

      <div className="space-y-5">
        {(chapters || []).map((chapter) => (
          <Card key={chapter.id}>
            <CardHeader>
              <CardTitle>
                Chapter {chapter.chapter_number}: {chapter.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(chapter.lessons || []).map((lesson: {
                id: string;
                lesson_code: string;
                title: string;
                source_page_start: number;
                source_page_end: number;
                lesson_videos?: Array<{ original_url: string }>;
                exercises?: Array<{ id: string; status: string }>;
              }) => (
                <div key={lesson.id} className="academy-surface rounded-lg p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {lesson.lesson_code} {lesson.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        PDF pages {lesson.source_page_start}-{lesson.source_page_end} · {lesson.exercises?.length || 0} exercises
                      </p>
                    </div>
                    <form action={saveLessonVideo} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="provider" value="youtube" />
                      <Input
                        name="url"
                        placeholder="YouTube unlisted link"
                        defaultValue={lesson.lesson_videos?.[0]?.original_url || ""}
                      />
                      <Button type="submit">Save video</Button>
                    </form>
                  </div>
                  <GenerateExercisePanel lessonId={lesson.id} lessonTitle={`${lesson.lesson_code} ${lesson.title}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
