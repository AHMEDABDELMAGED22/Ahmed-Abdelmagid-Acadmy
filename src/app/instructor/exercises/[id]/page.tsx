import { publishExercise } from "@/app/instructor/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorExerciseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exercise } = await supabase
    .from("exercises")
    .select("*, questions(*, question_options(*)), lessons(lesson_code, title), chapters(chapter_number, title)")
    .eq("id", id)
    .single();

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-200">Exercise Review</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{exercise?.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{exercise?.status}</Badge>
            <Badge className="border-blue-300/25 bg-blue-300/10 text-blue-200">{exercise?.language}</Badge>
            <Badge className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
              Pass {Math.round(Number(exercise?.pass_score || 0))}%
            </Badge>
          </div>
        </div>
        {exercise?.status === "draft" && (
          <form action={publishExercise}>
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <Button type="submit">Publish exercise</Button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {(exercise?.questions || []).map((question: {
          id: string;
          kind: string;
          prompt: string;
          correct_answer: string;
          explanation: string;
          source_excerpt: string;
          question_options?: Array<{ id: string; label: string; option_text: string; is_correct: boolean }>;
        }, index: number) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-cyan-200">Q{index + 1}</span>
                <span>{question.kind.replace("_", " ")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white">{question.prompt}</p>
              {question.question_options?.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {question.question_options.map((option) => (
                    <div
                      key={option.id}
                      className={`rounded-lg border p-3 text-sm ${
                        option.is_correct
                          ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                          : "border-slate-700 bg-slate-950/50 text-slate-300"
                      }`}
                    >
                      {option.label}. {option.option_text}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="rounded-lg bg-slate-950/70 p-4 text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-500">Answer:</span> {question.correct_answer}
                </p>
                <p className="mt-2 text-slate-300">
                  <span className="text-slate-500">Explanation:</span> {question.explanation}
                </p>
                <p className="mt-2 text-slate-500">Source idea: {question.source_excerpt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
