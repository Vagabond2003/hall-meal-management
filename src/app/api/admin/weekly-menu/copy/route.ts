import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { sourceWeekStart, targetWeekStart } = await request.json();

    if (!sourceWeekStart || !targetWeekStart) {
      return NextResponse.json({ error: "Both week start dates required" }, { status: 400 });
    }

    // Get source week
    const { data: sourceMenus, error: fetchError } = await supabaseAdmin
      .from("weekly_menus")
      .select("*")
      .eq("week_start_date", sourceWeekStart);

    if (fetchError) throw fetchError;

    // Delete all existing menus for the target week
    const { error: deleteError } = await supabaseAdmin
      .from("weekly_menus")
      .delete()
      .eq("week_start_date", targetWeekStart);
      
    if (deleteError) throw deleteError;

    if (!sourceMenus || sourceMenus.length === 0) {
      return NextResponse.json({ success: true, count: 0 }); // Nothing to copy
    }

    const newMenus = sourceMenus.map(m => ({
      week_start_date: targetWeekStart,
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
