import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLessonContext } from "@/lib/learning/lesson-context";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) return NextResponse.json({ error: "No lessonId provided." }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [{ data: content }, { data: lesson }] = await Promise.all([
      supabase
        .from("lesson_content")
        .select("point_content, try_content, exercise_content")
        .eq("lesson_id", lessonId)
        .maybeSingle(),
      supabase.from("lessons").select("title").eq("id", lessonId).single(),
    ]);

    const text = buildLessonContext({
      title: lesson?.title,
      pointContent: content?.point_content,
      tryContent: content?.try_content,
      exerciseContent: content?.exercise_content,
    });

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load lesson content." },
      { status: 500 }
    );
  }
}
