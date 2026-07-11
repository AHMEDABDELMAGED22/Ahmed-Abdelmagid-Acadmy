import { saveLessonVideo } from "@/app/instructor/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GenerateExercisePanel } from "@/components/learning/generate-exercise-panel";
import { PDFUploader } from "@/components/dashboard/pdf-uploader";
import { createClient } from "@/lib/supabase/server";
import { LessonContentEditor } from "@/components/instructor/lesson-content-editor";

export default async function InstructorCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: course }, { data: chapters }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).single(),
    supabase
      .from("chapters")
      .select("*, lessons(*, lesson_videos(*), lesson_content(*), exercises(*))")
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
                explanation_video_required?: boolean;
                point_required?: boolean;
                try_required?: boolean;
                try_video_required?: boolean;
                exercise_required?: boolean;
                exercise_video_required?: boolean;
                lesson_videos?: Array<{ original_url: string; provider: string; video_type: string }>;
                lesson_content?: Array<Record<string, string | null | undefined>> | Record<string, string | null | undefined> | null;
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
                    <div className="flex w-full flex-col gap-4 lg:max-w-xl">
                      {["explanation", "try_solution", "exercise_solution"].map((vType) => {
                        const video = Array.isArray(lesson.lesson_videos)
                          ? lesson.lesson_videos.find((v: { video_type: string }) => v.video_type === vType)
                          : undefined;

                        return (
                          <form key={vType} action={saveLessonVideo} className="flex flex-col gap-2 sm:flex-row">
                            <input type="hidden" name="lessonId" value={lesson.id} />
                            <input type="hidden" name="videoType" value={vType} />
                            <div className="flex w-32 items-center text-sm font-medium text-slate-300 capitalize">
                              {vType.replace('_', ' ')}
                            </div>
                            <select
                              name="provider"
                              defaultValue={video?.provider || "youtube"}
                              className="h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                            >
                              <option value="youtube">YouTube</option>
                              <option value="vimeo">Vimeo</option>
                              <option value="bunny">Bunny.net</option>
                              <option value="mux">Mux</option>
                            </select>
                            <Input
                              name="url"
                              placeholder="Video URL"
                              defaultValue={video?.original_url || ""}
                            />
                            <Button type="submit" variant="secondary">Save</Button>
                          </form>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <form action={async (formData) => {
                      "use server";
                      const supabase = await createClient();
                      await supabase.from("lessons").update({
                        explanation_video_required: formData.get("explanation_video_required") === "on",
                        point_required: formData.get("point_required") === "on",
                        try_required: formData.get("try_required") === "on",
                        try_video_required: formData.get("try_video_required") === "on",
                        exercise_required: formData.get("exercise_required") === "on",
                        exercise_video_required: formData.get("exercise_video_required") === "on",
                      }).eq("id", lesson.id);
                    }} className="flex flex-wrap gap-4 text-sm text-slate-300">
                      <label className="flex items-center gap-2"><input type="checkbox" name="explanation_video_required" defaultChecked={Boolean(lesson.explanation_video_required)} /> Explanation Video Required</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="point_required" defaultChecked={Boolean(lesson.point_required)} /> Point Required</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="try_required" defaultChecked={Boolean(lesson.try_required)} /> Try Required</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="try_video_required" defaultChecked={Boolean(lesson.try_video_required)} /> Try Video Required</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="exercise_required" defaultChecked={Boolean(lesson.exercise_required)} /> Exercise Required</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="exercise_video_required" defaultChecked={Boolean(lesson.exercise_video_required)} /> Exercise Video Required</label>
                      <Button type="submit" variant="secondary" size="sm" className="ml-auto">Save Rules</Button>
                    </form>
                  </div>
                  <LessonContentEditor lessonId={lesson.id} initialContent={Array.isArray(lesson.lesson_content) ? lesson.lesson_content[0] : (lesson.lesson_content || {})} />
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <PDFUploader lessonId={lesson.id} />
                  </div>
                  <div className="mt-4">
                    <GenerateExercisePanel lessonId={lesson.id} lessonTitle={`${lesson.lesson_code} ${lesson.title}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
