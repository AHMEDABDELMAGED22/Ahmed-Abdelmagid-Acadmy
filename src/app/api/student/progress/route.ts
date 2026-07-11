import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { lesson_id, field, value } = body;

    if (!lesson_id || !field) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Only allow updating specific boolean fields
    const allowedFields = ["point_completed", "try_completed", "unlocked"];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // Use admin client because RLS blocks student writes on lesson_progress
    const adminClient = await createAdminClient();
    const { error } = await adminClient
      .from("lesson_progress")
      .update({ [field]: value })
      .eq("student_id", user.id)
      .eq("lesson_id", lesson_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 500 });
  }
}
