import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/pdf/extract";

export async function POST(request: NextRequest) {
  try {
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

    const form = await request.formData();
    const file = form.get("file");
    const lessonId = form.get("lessonId") as string;

    if (!(file instanceof File) || !lessonId) {
      return NextResponse.json({ error: "No PDF file or lessonId provided." }, { status: 400 });
    }

    const text = await extractTextFromPdf(Buffer.from(await file.arrayBuffer()));

    const adminClient = await createAdminClient();
    const { error: upsertError } = await adminClient
      .from("lesson_content")
      .upsert(
        { lesson_id: lessonId, point_content: text },
        { onConflict: "lesson_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json({ text, length: text.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF extraction failed." },
      { status: 500 }
    );
  }
}

export const maxDuration = 120;
