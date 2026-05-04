import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart");

  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  }

  try {
    const [menusResult, slotsResult] = await Promise.all([
      supabaseAdmin
        .from("weekly_menus")
        .select("*")
        .eq("week_start_date", weekStart)
        .order("day_of_week", { ascending: true })
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("meal_slots")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
    ]);

    if (menusResult.error) throw menusResult.error;
    if (slotsResult.error) throw slotsResult.error;

    return NextResponse.json({ 
      menus: menusResult.data,
      slots: slotsResult.data 
    });
  } catch (error) {
    console.error("GET /api/admin/weekly-menu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { week_start_date, day_of_week, meal_slot, items, price, is_active } = body;

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from("weekly_menus")
      .select("id")
      .eq("week_start_date", week_start_date)
      .eq("day_of_week", day_of_week)
      .eq("meal_slot", meal_slot)
      .single();

    let resData;

    if (existing) {
      // Update
      const { data, error } = await supabaseAdmin
        .from("weekly_menus")
        .update({ items, price, is_active: is_active ?? true })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (error) throw error;
      resData = data;
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from("weekly_menus")
        .insert({ week_start_date, day_of_week, meal_slot, items, price, is_active: is_active ?? true })
        .select()
        .single();
      
      if (error) throw error;
      resData = data;
    }

    // Auto-sync custom slots to the `meals` table so they have a UUID for `meal_selections`
    const { data: existingMeal } = await supabaseAdmin
      .from("meals")
      .select("id")
      .ilike("name", meal_slot)
      .eq("meal_type", "regular")
      .single();

    if (!existingMeal) {
      // Capitalize first letter logic
      const slotName = meal_slot.charAt(0).toUpperCase() + meal_slot.slice(1);
      await supabaseAdmin.from("meals").insert({
        name: slotName,
        price: 0, // Weekly menu price overrides this
        meal_type: "regular",
        is_active: true
      });
    }

    return NextResponse.json({ menu: resData });
  } catch (error) {
    console.error("POST /api/admin/weekly-menu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
