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
  
  const targetWeeks: string[] = [];
  let currentObj = startOfWeek(startDateObj, { weekStartsOn: 0 });
  const endWeekObj = startOfWeek(endDateObj, { weekStartsOn: 0 });
  
  while (currentObj <= endWeekObj) {
    targetWeeks.push(format(currentObj, "yyyy-MM-dd"));
    currentObj = addDays(currentObj, 7);
  }

  const [menusResult, slotsResult] = await Promise.all([
    supabaseAdmin
      .from("weekly_menus")
      .select("id, week_start_date, day_of_week, meal_slot, items, price, is_active")
      .in("week_start_date", targetWeeks)
      .eq("is_active", true),
    supabaseAdmin
      .from("meal_slots")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
  ]);

  if (menusResult.error) {
    return NextResponse.json({ error: menusResult.error.message }, { status: 500 });
  }
  if (slotsResult.error) {
    return NextResponse.json({ error: slotsResult.error.message }, { status: 500 });
  }

  const data = menusResult.data;

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

  const response = NextResponse.json({ menus: finalMenus, slots: slotsResult.data });
  response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return response;
}
