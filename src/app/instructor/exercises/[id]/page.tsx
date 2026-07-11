import { publishExercise } from "@/app/instructor/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionEditor, Question } from "@/components/dashboard/question-editor";
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
        {(exercise?.questions || []).map((question: Question, index: number) => (
          <QuestionEditor key={question.id} question={question} exerciseId={exercise.id} index={index} />
        ))}
        {exercise?.status === "draft" && (
          <QuestionEditor 
            key="new-question"
            exerciseId={exercise.id} 
            index={exercise.questions?.length || 0}
            question={{
              kind: "mcq",
              prompt: "",
              correct_answer: "",
              explanation: "",
              source_excerpt: "Added manually",
            }}
          />
        )}
      </div>
    </div>
  );
}
