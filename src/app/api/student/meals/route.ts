import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format } from "date-fns";

// GET /api/student/meals — fetch all active meals + settings deadline
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [mealsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("meals").select("*").eq("is_active", true).order("created_at"),
    supabaseAdmin.from("settings").select("meal_selection_deadline, admin_secret_code").limit(1).single(),
  ]);

  if (mealsRes.error) {
    return NextResponse.json({ error: mealsRes.error.message }, { status: 500 });
  }

  // Fetch today's weekly_menus if date is provided
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  
  let processedMeals = mealsRes.data ?? [];

  if (dateParam) {
    const [year, month, day] = dateParam.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekStartStr = format(weekStart, "yyyy-MM-dd");

    const { data: todayMenus } = await supabaseAdmin
      .from("weekly_menus")
      .select("meal_slot, items, price")
      .eq("week_start_date", weekStartStr)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    processedMeals = processedMeals.map(m => {
      if (m.meal_type === "regular") {
        const slot = todayMenus?.find(tm => tm.meal_slot.toLowerCase() === m.name.toLowerCase());
        if (slot) {
          return { ...m, description: slot.items, price: slot.price, hasMenu: true };
        }
        return { ...m, hasMenu: false };
      }
      return m;
    });
  }

  return NextResponse.json({
    meals: processedMeals,
    deadline: settingsRes.data?.meal_selection_deadline ?? "22:00:00",
  });
}
