import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    const [year, month, day] = dateParam.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekStartStr = format(weekStart, "yyyy-MM-dd");

    const { data: menus, error } = await supabaseAdmin
      .from("weekly_menus")
      .select("id, meal_slot, items, price")
      .eq("week_start_date", weekStartStr)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (error) throw error;
    return NextResponse.json({ menus });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
