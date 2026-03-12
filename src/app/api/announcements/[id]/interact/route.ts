import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/announcements/[id]/interact
// Student only: upsert read/like status
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Missing announcement ID" }, { status: 400 });
    }

    const body = await request.json();
    const { is_read, is_liked } = body;

    // First fetch existing interaction if it exists
    const { data: existing, error: existError } = await supabaseAdmin
      .from("announcement_interactions")
      .select("is_read, is_liked")
      .eq("announcement_id", id)
      .eq("student_id", session.user.id)
      .single();

    // Ignore 406 Not Acceptable which Supabase returns for zero rows in `.single()`
    if (existError && existError.code !== "PGRST116") {
      throw existError;
    }

    const newIsRead = is_read !== undefined ? is_read : (existing?.is_read || false);
    const newIsLiked = is_liked !== undefined ? is_liked : (existing?.is_liked || false);

    const { error: upsertError } = await supabaseAdmin
      .from("announcement_interactions")
      .upsert({
        announcement_id: id,
        student_id: session.user.id,
        is_read: newIsRead,
        is_liked: newIsLiked
      }, { onConflict: "announcement_id, student_id" });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, is_read: newIsRead, is_liked: newIsLiked });
  } catch (error) {
    console.error("POST /api/announcements/[id]/interact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
