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

    // 1. Fetch Meal Selections for the given month/year
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: selectionsData, error: selectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        date,
        is_selected,
        meal_id,
        weekly_menu_id,
        price,
        weekly_menus (
          id,
          week_start_date,
          day_of_week,
          meal_slot,
          items,
          price
        )
      `)
      .eq("student_id", id)
      .eq("is_selected", true)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (selectionsError) {
      console.error("[Admin Student Detail] Error fetching month selections:", selectionsError);
    }

    // Format selections
    const formattedSelections = selectionsData?.map(s => {
      const weeklyMenu: any = (s as any).weekly_menus;
      const weeklyRecord = Array.isArray(weeklyMenu) ? weeklyMenu[0] : weeklyMenu;
      return {
        id: s.id,
        date: s.date,
        meal_name: weeklyRecord?.meal_slot ?? "Unknown",
        items: weeklyRecord?.items ?? null,
        cost: (s as any).price ?? weeklyRecord?.price ?? 0,
        is_selected: s.is_selected,
      };
    }) || [];

    // 2. Fetch Billing Records (all time)
    const { data: billingData } = await supabaseAdmin
      .from("monthly_billing")
      .select("*")
      .eq("student_id", id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    // 3. Fetch Today's Selections
    const today = searchParams.get("date") || new Date().toISOString().split('T')[0];
    
    const { data: todaySelectionsData, error: todaySelectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        date,
        is_selected,
        meal_id,
        weekly_menu_id,
        price,
        weekly_menus (
          id,
          week_start_date,
          day_of_week,
          meal_slot,
          items,
          price
        )
      `)
      .eq("student_id", id)
      .eq("is_selected", true)
      .eq("date", today);

    if (todaySelectionsError) {
      console.error("[Admin Student Detail] Error fetching today selections:", todaySelectionsError);
    }

    const formattedTodaySelections = todaySelectionsData?.map(s => {
      const weeklyMenu: any = (s as any).weekly_menus;
      const weeklyRecord = Array.isArray(weeklyMenu) ? weeklyMenu[0] : weeklyMenu;
      return {
        id: s.id,
        date: s.date,
        meal_name: weeklyRecord?.meal_slot ?? "Unknown",
        items: weeklyRecord?.items ?? null,
        cost: (s as any).price ?? weeklyRecord?.price ?? 0,
        is_selected: s.is_selected,
      };
    }) || [];

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
