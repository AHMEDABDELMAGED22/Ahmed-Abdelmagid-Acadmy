import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { prompt, correct_answer, explanation, options } = await request.json();

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

    const { error: qError } = await adminClient
      .from("questions")
      .update({ prompt, correct_answer, explanation })
      .eq("id", id);

    if (qError) throw qError;

    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id) {
          await adminClient
            .from("question_options")
            .update({ option_text: opt.option_text, is_correct: opt.is_correct })
            .eq("id", opt.id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
