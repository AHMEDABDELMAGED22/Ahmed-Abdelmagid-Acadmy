"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LessonContentEditor({ lessonId, initialContent }: { lessonId: string, initialContent: Record<string, string | null | undefined> }) {
  const [point, setPoint] = useState(initialContent?.point_content || "");
  const [tryContent, setTryContent] = useState(initialContent?.try_content || "");
  const [exercise, setExercise] = useState(initialContent?.exercise_content || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/instructor/lessons/${lessonId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point_content: point, try_content: tryContent, exercise_content: exercise })
      });
      if (!res.ok) throw new Error("Failed to save content");
      toast.success("Content saved successfully.");
    } catch {
      toast.error("Error saving content.");
    }
    setIsSaving(false);
  };

  return (
    <details className="mt-4 border-t border-slate-800 pt-4">
      <summary className="cursor-pointer text-sm font-medium text-cyan-400">Edit Lesson Text Content (Point, Try, Exercise)</summary>
      <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Point! Content</label>
          <textarea
            value={point}
            onChange={e => setPoint(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white"
            placeholder="Enter Point! text..."
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Try Content</label>
          <textarea
            value={tryContent}
            onChange={e => setTryContent(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white"
            placeholder="Enter Try text..."
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Exercise Content (Textbook original)</label>
          <textarea
            value={exercise}
            onChange={e => setExercise(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-white"
            placeholder="Enter Exercise text..."
          />
        </div>
        <Button type="submit" disabled={isSaving} className="self-end">
          {isSaving ? "Saving..." : "Save Text Content"}
        </Button>
      </form>
    </details>
  );
}
