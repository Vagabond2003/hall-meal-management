import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

import { startOfWeek, addDays, parseISO, format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  // Calculate the week_start_date(s) we need to query
  // Sunday-based week starts
  const startDateObj = parseISO(startDateStr);
  const endDateObj = parseISO(endDateStr);
  
  const weekStart1 = format(startOfWeek(startDateObj, { weekStartsOn: 0 }), "yyyy-MM-dd");
  const weekStart2 = format(startOfWeek(endDateObj, { weekStartsOn: 0 }), "yyyy-MM-dd");
  
  const targetWeeks = weekStart1 === weekStart2 ? [weekStart1] : [weekStart1, weekStart2];

  const { data, error } = await supabaseAdmin
    .from("weekly_menus")
    .select("id, week_start_date, day_of_week, meal_slot, items, price, is_active")
    .in("week_start_date", targetWeeks)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map each menu row to its absolute date
  const processedMenus = (data || []).map(menu => {
    // Determine the absolute date: week_start_date + day_of_week
    const ws = parseISO(menu.week_start_date);
    const absoluteDate = addDays(ws, menu.day_of_week);
    
    return {
      id: menu.id,
      date: format(absoluteDate, "yyyy-MM-dd"), // <-- NEW explicitly calculated date
      meal_slot: menu.meal_slot,
      items: menu.items,
      price: menu.price
    };
  });

  // Filter the mapped items to be strictly between startDate and endDate
  const finalMenus = processedMenus.filter(m => {
    return m.date >= startDateStr && m.date <= endDateStr;
  });

  // Sort by date then slot (optional, but good for consistent UI)
  finalMenus.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ menus: finalMenus }, { headers: { "Cache-Control": "no-store, max-age=0, private" } });
}
