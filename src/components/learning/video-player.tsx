"use client";

import { useState } from "react";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoPlayer({
  lessonId,
  embedUrl,
  completed,
}: {
  lessonId: string;
  embedUrl: string | null;
  completed: boolean;
}) {
  const [done, setDone] = useState(completed);
  const [saving, setSaving] = useState(false);

  async function markComplete() {
    setSaving(true);
    await fetch("/api/learning/mark-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    setDone(true);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-lg border border-slate-800 bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Lesson video"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-slate-500">
            <div>
              <PlayCircle className="mx-auto mb-3 h-10 w-10" />
              <p>No video link has been added yet.</p>
            </div>
          </div>
        )}
      </div>
      <Button onClick={markComplete} disabled={saving || done || !embedUrl} variant={done ? "secondary" : "primary"}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        {done ? "Video completed" : saving ? "Saving..." : "Mark video complete"}
      </Button>
    </div>
  );
}
