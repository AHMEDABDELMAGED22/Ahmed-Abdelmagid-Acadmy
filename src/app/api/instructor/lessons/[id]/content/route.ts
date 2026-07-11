import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "instructor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const { error } = await supabase.from("lesson_content").upsert({
    lesson_id: id,
    point_content: body.point_content,
    try_content: body.try_content,
    exercise_content: body.exercise_content
  }, { onConflict: "lesson_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
