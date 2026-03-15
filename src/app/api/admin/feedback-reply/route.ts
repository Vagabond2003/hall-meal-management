import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST /api/admin/feedback-reply
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { feedback_id, reply } = body as {
    feedback_id?: string;
    reply?: string;
  };

  if (!feedback_id || !reply?.trim()) {
    return NextResponse.json({ error: "feedback_id and reply are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("meal_feedback_replies").insert({
    feedback_id,
    admin_id: session.user.id,
    reply: reply.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/feedback-reply?id=X
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Only delete own reply
  const { data: reply } = await supabaseAdmin
    .from("meal_feedback_replies")
    .select("admin_id")
    .eq("id", id)
    .single();

  if (!reply || reply.admin_id !== session.user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("meal_feedback_replies")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
