import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/feedback?month=5&year=2026
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  // Default to current month if not provided
  const now = new Date();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();

  // Calculate month start and end dates
  const monthStart = new Date(targetYear, targetMonth - 1, 1).toISOString();
  const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

  try {
    // Fetch feedback with nested data
    const { data: feedback, error } = await supabaseAdmin
      .from("meal_feedback")
      .select(`
        id,
        rating,
        comment,
        date,
        created_at,
        updated_at,
        student_id,
        weekly_menu_id,
        student:users(name, token_number, room_number),
        weekly_menu:weekly_menus(meal_slot, items, week_start_date),
        replies:meal_feedback_replies(
          id,
          reply,
          created_at,
          admin:users(name)
        )
      `)
      .gte("date", monthStart.split("T")[0])
      .lte("date", monthEnd.split("T")[0])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the response to match expected shape
    const flattenedFeedback = (feedback || []).map((item: any) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      date: item.date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      student_id: item.student_id,
      weekly_menu_id: item.weekly_menu_id,
      student: item.student || { name: "Unknown", token_number: "", room_number: "" },
      weekly_menu: item.weekly_menu || { meal_slot: "", items: "", week_start_date: "" },
      replies: (item.replies || []).map((reply: any) => ({
        id: reply.id,
        reply: reply.reply,
        created_at: reply.created_at,
        admin: reply.admin || { name: "Admin" },
      })),
    }));

    return NextResponse.json({ feedback: flattenedFeedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch feedback" }, { status: 500 });
  }
}
