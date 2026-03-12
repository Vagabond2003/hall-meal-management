import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    // 1. Fetch Meal Selections for the given month/year (no joins)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: selectionsData, error: selectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select("id, date, is_selected, meal_id, weekly_menu_id, price")
      .eq("student_id", id)
      .eq("is_selected", true)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (selectionsError) {
      console.error("[Admin Student Detail] Error fetching month selections:", selectionsError);
    }

    // Fetch weekly menu details for all weekly_menu_ids in one query
    const weeklyMenuIds = (selectionsData ?? [])
      .map(s => s.weekly_menu_id)
      .filter(Boolean) as string[];

    let weeklyMenuMap: Record<string, { meal_slot: string; items: string; price: number }> = {};
    if (weeklyMenuIds.length > 0) {
      const { data: weeklyMenus } = await supabaseAdmin
        .from("weekly_menus")
        .select("id, meal_slot, items, price")
        .in("id", weeklyMenuIds);
      if (weeklyMenus) {
        weeklyMenuMap = Object.fromEntries(weeklyMenus.map(m => [m.id, m]));
      }
    }

    const formattedSelections = (selectionsData ?? []).map(s => {
      const wm = s.weekly_menu_id ? weeklyMenuMap[s.weekly_menu_id] : null;
      return {
        id: s.id,
        date: s.date,
        meal_name: wm?.meal_slot ?? "Unknown",
        items: wm?.items ?? null,
        cost: s.price ?? wm?.price ?? 0,
        is_selected: s.is_selected,
      };
    });

    // 2. Fetch Billing Records (all time)
    const { data: billingData } = await supabaseAdmin
      .from("monthly_billing")
      .select("*")
      .eq("student_id", id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    // 3. Fetch Today's Selections (no joins)
    const today = searchParams.get("date") || new Date().toISOString().split('T')[0];

    const { data: todaySelectionsData, error: todaySelectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select("id, date, is_selected, meal_id, weekly_menu_id, price")
      .eq("student_id", id)
      .eq("is_selected", true)
      .eq("date", today);

    if (todaySelectionsError) {
      console.error("[Admin Student Detail] Error fetching today selections:", todaySelectionsError);
    }

    // Fetch weekly menu details for today's selections
    const todayWeeklyMenuIds = (todaySelectionsData ?? [])
      .map(s => s.weekly_menu_id)
      .filter(Boolean) as string[];

    let todayWeeklyMenuMap: Record<string, { meal_slot: string; items: string; price: number }> = {};
    if (todayWeeklyMenuIds.length > 0) {
      const { data: todayMenus } = await supabaseAdmin
        .from("weekly_menus")
        .select("id, meal_slot, items, price")
        .in("id", todayWeeklyMenuIds);
      if (todayMenus) {
        todayWeeklyMenuMap = Object.fromEntries(todayMenus.map(m => [m.id, m]));
      }
    }

    const formattedTodaySelections = (todaySelectionsData ?? []).map(s => {
      const wm = s.weekly_menu_id ? todayWeeklyMenuMap[s.weekly_menu_id] : null;
      return {
        id: s.id,
        date: s.date,
        meal_name: wm?.meal_slot ?? "Unknown",
        items: wm?.items ?? null,
        cost: s.price ?? wm?.price ?? 0,
        is_selected: s.is_selected,
      };
    });

    return NextResponse.json({
      selections: formattedSelections,
      billing: billingData || [],
      todaySelections: formattedTodaySelections
    });

  } catch (error) {
    console.error("Student details fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}