"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateExercisePanel({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lessonContext, setLessonContext] = useState("");
  const [language, setLanguage] = useState<"english" | "arabic">("english");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          kind: "lesson_practice",
          title: `Lesson Exercise - ${lessonTitle}`,
          language,
          lessonContext,
          counts: {
            mcq: 4,
            true_false: 2,
            short_answer: 2,
            practical: 2,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Draft exercise generated for review.");
      router.push(`/instructor/exercises/${data.exerciseId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Generate AI exercise
      </Button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-cyan-300/20 bg-slate-950/70 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-cyan-200">Paste official PDF lesson context</p>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as "english" | "arabic")}
          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
        >
          <option value="english">English</option>
          <option value="arabic">Arabic</option>
        </select>
      </div>
      <textarea
        value={lessonContext}
        onChange={(event) => setLessonContext(event.target.value)}
        placeholder="Paste the text from this lesson's PDF pages. Minimum 500 characters."
        className="min-h-40 w-full rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
      />
      <div className="mt-3 flex gap-2">
        <Button onClick={generate} disabled={loading || lessonContext.trim().length < 500}>
          {loading ? "Generating..." : "Generate draft"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
