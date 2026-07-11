import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { exercise_id, kind, prompt, correct_answer, explanation, source_excerpt, options } = await request.json();

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

    const adminClient = await createAdminClient();

    const { data: question, error: qError } = await adminClient
      .from("questions")
      .insert({
        exercise_id,
        kind,
        prompt,
        correct_answer,
        explanation,
        source_excerpt: source_excerpt || "Added manually",
      })
      .select()
      .single();

    if (qError) throw qError;

    if (kind === "mcq" && options && Array.isArray(options)) {
      const optionRows = options.map((opt: { label: string; option_text: string; is_correct: boolean }) => ({
        question_id: question.id,
        label: opt.label,
        option_text: opt.option_text,
        is_correct: Boolean(opt.is_correct),
      }));

      const { error: optError } = await adminClient.from("question_options").insert(optionRows);
      if (optError) throw optError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Add failed" },
      { status: 500 }
    );
  }
}
