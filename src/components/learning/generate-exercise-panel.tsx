"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Load existing context
    fetch(`/api/instructor/lesson-content?lessonId=${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.text) setLessonContext(data.text);
      })
      .catch(console.error);

    // Listen for PDF upload completion
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setLessonContext(customEvent.detail);
    };
    window.addEventListener(`lesson-content-updated-${lessonId}`, handler);
    return () => window.removeEventListener(`lesson-content-updated-${lessonId}`, handler);
  }, [lessonId]);

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
            mcq: 6,
            true_false: 2,
            short_answer: 0,
            practical: 0,
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
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-cyan-200">Lesson Context</p>
        </div>
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
        placeholder="Lesson context is built from Point, Try, and Exercise content. Minimum 200 characters."
        className="min-h-40 w-full rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-cyan-400"
      />
      <div className="mt-3 flex gap-2">
        <Button onClick={generate} disabled={loading || lessonContext.trim().length < 200}>
          {loading ? "Generating..." : "Generate draft"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
