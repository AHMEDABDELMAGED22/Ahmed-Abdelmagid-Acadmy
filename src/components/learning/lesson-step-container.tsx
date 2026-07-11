"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface LessonStepProps {
  title: string;
  isLocked: boolean;
  isCompleted: boolean;
  isRequired: boolean;
  lessonId: string;
  progressField?: string;
  buttonText?: string;
  children: React.ReactNode;
}

export function LessonStepContainer({
  title,
  isLocked,
  isCompleted,
  isRequired,
  lessonId,
  progressField,
  buttonText = "Mark Complete",
  children,
}: LessonStepProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkComplete = async () => {
    if (!progressField) return;
    setIsMarking(true);
    try {
      const res = await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId, field: progressField, value: true }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
    setIsMarking(false);
  };

  return (
    <div className={`relative rounded-xl border p-6 transition-all ${isLocked ? "border-slate-800 bg-slate-900/20 opacity-75" : isCompleted ? "border-emerald-500/30 bg-slate-950/50" : "border-slate-700 bg-slate-950"}`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
          {isLocked && <Lock className="w-5 h-5 text-slate-500" />}
          {!isLocked && isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {title}
          {!isRequired && !isLocked && !isCompleted && <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-full ml-2 font-normal">Optional</span>}
        </h3>
      </div>

      <div className={isLocked ? "pointer-events-none blur-sm select-none" : ""}>
        {children}
      </div>

      {!isLocked && !isCompleted && progressField && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleMarkComplete} disabled={isMarking} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isMarking ? "Saving..." : buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}
