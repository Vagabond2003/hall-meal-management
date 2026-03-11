import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { fromWeekStart, toWeekStart } = await request.json();

    if (!fromWeekStart || !toWeekStart) {
      return NextResponse.json({ error: "Both week start dates required" }, { status: 400 });
    }

    // Get source week
    const { data: sourceMenus, error: fetchError } = await supabaseAdmin
      .from("weekly_menus")
      .select("*")
      .eq("week_start_date", fromWeekStart);

    if (fetchError) throw fetchError;
    if (!sourceMenus || sourceMenus.length === 0) {
      return NextResponse.json({ success: true, count: 0 }); // Nothing to copy
    }

    // Get target week menus to avoid conflicts
    const { data: targetMenus, error: targetError } = await supabaseAdmin
      .from("weekly_menus")
      .select("day_of_week, meal_slot")
      .eq("week_start_date", toWeekStart);
    
    if (targetError) throw targetError;

    // Filter out conflicts
    const targetSet = new Set(targetMenus?.map(m => `${m.day_of_week}-${m.meal_slot}`));
    
    const newMenus = sourceMenus
      .filter(m => !targetSet.has(`${m.day_of_week}-${m.meal_slot}`))
      .map(m => ({
        week_start_date: toWeekStart,
        day_of_week: m.day_of_week,
        meal_slot: m.meal_slot,
        items: m.items,
        price: m.price,
        is_active: m.is_active
      }));

    if (newMenus.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("weekly_menus")
        .insert(newMenus);
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, count: newMenus.length });
  } catch (error) {
    console.error("POST /api/admin/weekly-menu/copy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
