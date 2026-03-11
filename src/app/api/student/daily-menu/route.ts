import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { startOfDay } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD

  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    const date = new Date(dateParam);
    const dayOfWeek = date.getDay(); // 0-6

    // Find the Sunday of the week
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Fetch the menu for that specific day
    const { data: menus, error } = await supabaseAdmin
      .from("weekly_menus")
      .select("id, meal_slot, items, price")
      .eq("week_start_date", weekStartStr)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (error) throw error;
    
    return NextResponse.json({ menus });
  } catch (error) {
    console.error("GET /api/student/daily-menu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
