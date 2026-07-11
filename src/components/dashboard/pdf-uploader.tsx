"use client";

import { useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function PDFUploader({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState(false);
  const [hasText, setHasText] = useState(false);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonId", lessonId);

      const response = await fetch("/api/pdf/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setHasText(true);
      toast.success("Lesson text extracted and saved to database.");
      // Trigger a reload of the context in the panel
      window.dispatchEvent(new CustomEvent(`lesson-content-updated-${lessonId}`, { detail: data.text }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extract PDF.");
    } finally {
      setLoading(false);
      // Reset the input
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Upload Lesson PDF snippet</h3>
          <p className="mt-1 text-xs text-slate-400">
            Upload the PDF pages for this specific lesson.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasText && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Book loaded
            </div>
          )}
          <label className="relative flex cursor-pointer items-center justify-center rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300">
            <Upload className="mr-2 h-4 w-4" />
            {loading ? "Extracting..." : "Upload PDF"}
            <input
              type="file"
              accept=".pdf"
              className="absolute inset-0 hidden"
              onChange={handleFileSelect}
              disabled={loading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
