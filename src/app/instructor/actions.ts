"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveVideoEmbed } from "@/lib/video/providers";
import type { VideoProvider } from "@/lib/types";

async function requireInstructor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "instructor") redirect("/student");
  return { supabase, user };
}

export async function publishExercise(formData: FormData) {
  const { supabase } = await requireInstructor();
  const exerciseId = String(formData.get("exerciseId") || "");
  if (!exerciseId) return;

  await supabase.from("exercises").update({ status: "published" }).eq("id", exerciseId);
  revalidatePath("/instructor/exercises");
  revalidatePath(`/instructor/exercises/${exerciseId}`);
}

export async function saveLessonVideo(formData: FormData) {
  const { supabase } = await requireInstructor();
  const lessonId = String(formData.get("lessonId") || "");
  const url = String(formData.get("url") || "");
  const provider = (String(formData.get("provider") || "youtube") || "youtube") as VideoProvider;

  if (!lessonId || !url) return;

  const embed = resolveVideoEmbed(url, provider);
  await supabase.from("lesson_videos").upsert(
    {
      lesson_id: lessonId,
      provider,
      original_url: url,
      provider_video_id: embed.providerVideoId,
      embed_url: embed.embedUrl,
    },
    { onConflict: "lesson_id" }
  );

  revalidatePath("/instructor/courses");
}
