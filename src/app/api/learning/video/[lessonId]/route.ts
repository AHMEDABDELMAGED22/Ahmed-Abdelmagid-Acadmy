import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSecureEmbedUrl } from "@/lib/video/providers";
import type { VideoProvider } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();

    /* ── 1. Authentication ── */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── 2. Lesson exists? ── */
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, course_id, order_index")
      .eq("id", lessonId)
      .single();

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    /* ── 3. Role check ── */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isInstructor = profile?.role === "instructor";

    /* ── 4. Enrollment check (students only) ── */
    if (!isInstructor) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", lesson.course_id)
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }

      /* ── 5. Unlock check (students only) ── */
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("student_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (lesson.order_index !== 1 && !progress) {
        return NextResponse.json({ error: "Lesson locked" }, { status: 403 });
      }
    }

    /* ── 6. Fetch video record (provider + video_id only) ── */
    const { data: videoData } = await supabase
      .from("lesson_videos")
      .select("provider, provider_video_id")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (!videoData?.provider_video_id) {
      return NextResponse.json({ embedUrl: null, provider: null });
    }

    /* ── 7. Generate embed URL at request time ── */
    const embedUrl = generateSecureEmbedUrl(
      videoData.provider as VideoProvider,
      videoData.provider_video_id
    );

    // FUTURE MIGRATION:
    // For Bunny: generate signed token URL here
    // For Mux: generate signed JWT playback URL here
    // The component does not need to change — only this function.

    return NextResponse.json({
      embedUrl: embedUrl ?? null,
      provider: videoData.provider,
    });
  } catch (error) {
    console.error("Video API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
