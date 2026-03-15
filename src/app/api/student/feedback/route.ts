import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/student/feedback?weekly_menu_id=X&date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weeklyMenuId = searchParams.get("weekly_menu_id");
  const date = searchParams.get("date");

  if (!weeklyMenuId || !date) {
    return NextResponse.json({ error: "weekly_menu_id and date are required" }, { status: 400 });
  }

  // 1. Fetch all feedback rows for this menu+date
  const { data: feedbackRows, error: fbErr } = await supabaseAdmin
    .from("meal_feedback")
    .select("id, student_id, rating, comment, created_at, updated_at")
    .eq("weekly_menu_id", weeklyMenuId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (fbErr) {
    return NextResponse.json({ error: fbErr.message }, { status: 500 });
  }

  if (!feedbackRows || feedbackRows.length === 0) {
    return NextResponse.json({ feedback: [] });
  }

  // 2. Fetch student info for all student_ids
  const studentIds = [...new Set(feedbackRows.map((f) => f.student_id))];
  const { data: students } = await supabaseAdmin
    .from("users")
    .select("id, name, token_number")
    .in("id", studentIds);

  const studentMap = new Map(
    (students || []).map((s: any) => [s.id, { name: s.name, token_number: s.token_number }])
  );

  // 3. Fetch all replies for all feedback_ids
  const feedbackIds = feedbackRows.map((f) => f.id);
  const { data: replies } = await supabaseAdmin
    .from("meal_feedback_replies")
    .select("id, feedback_id, admin_id, reply, created_at, updated_at")
    .in("feedback_id", feedbackIds)
    .order("created_at", { ascending: true });

  // 4. Fetch admin info for all admin_ids in replies
  const adminIds = [...new Set((replies || []).map((r: any) => r.admin_id))];
  let adminMap = new Map<string, { name: string }>();
  if (adminIds.length > 0) {
    const { data: admins } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .in("id", adminIds);
    adminMap = new Map(
      (admins || []).map((a: any) => [a.id, { name: a.name }])
    );
  }

  // 5. Assemble
  const feedback = feedbackRows.map((f) => ({
    id: f.id,
    student_id: f.student_id,
    rating: f.rating,
    comment: f.comment,
    created_at: f.created_at,
    updated_at: f.updated_at,
    student: studentMap.get(f.student_id) || { name: "Unknown", token_number: "" },
    replies: (replies || [])
      .filter((r: any) => r.feedback_id === f.id)
      .map((r: any) => ({
        id: r.id,
        reply: r.reply,
        created_at: r.created_at,
        updated_at: r.updated_at,
        admin: adminMap.get(r.admin_id) || { name: "Admin" },
      })),
  }));

  return NextResponse.json({ feedback });
}

// POST /api/student/feedback
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { weekly_menu_id, date, rating, comment } = body as {
    weekly_menu_id?: string;
    date?: string;
    rating?: number;
    comment?: string;
  };

  if (!weekly_menu_id || !date) {
    return NextResponse.json({ error: "weekly_menu_id and date are required" }, { status: 400 });
  }

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  // Only allow feedback on past dates (BD timezone)
  const bdToday = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  )
    .toISOString()
    .split("T")[0];

  if (date >= bdToday) {
    return NextResponse.json({ error: "Can only review past meals" }, { status: 403 });
  }

  // Student must have a meal_selection for this menu+date with is_selected=true
  const { data: selection } = await supabaseAdmin
    .from("meal_selections")
    .select("id")
    .eq("student_id", session.user.id)
    .eq("weekly_menu_id", weekly_menu_id)
    .eq("date", date)
    .eq("is_selected", true)
    .maybeSingle();

  if (!selection) {
    return NextResponse.json(
      { error: "You can only review meals you have eaten" },
      { status: 403 }
    );
  }

  // Upsert feedback
  const { error } = await supabaseAdmin.from("meal_feedback").upsert(
    {
      student_id: session.user.id,
      weekly_menu_id,
      date,
      rating,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,weekly_menu_id,date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/student/feedback?id=X
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Only delete own feedback
  const { data: feedback } = await supabaseAdmin
    .from("meal_feedback")
    .select("student_id")
    .eq("id", id)
    .single();

  if (!feedback || feedback.student_id !== session.user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("meal_feedback")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
