import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/student/meals — fetch all active meals + settings deadline
export async function GET() {
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

  // Fetch today's weekly_menus
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const { data: todayMenus } = await supabaseAdmin
    .from("weekly_menus")
    .select("meal_slot, items, price")
    .eq("week_start_date", weekStartStr)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  const processedMeals = (mealsRes.data ?? []).map(m => {
    if (m.meal_type === "regular") {
      const slot = todayMenus?.find(tm => tm.meal_slot.toLowerCase() === m.name.toLowerCase());
      if (slot) {
        return { ...m, description: slot.items, price: slot.price, hasMenu: true };
      }
      return { ...m, hasMenu: false };
    }
    return m;
  });

  return NextResponse.json({
    meals: processedMeals,
    deadline: settingsRes.data?.meal_selection_deadline ?? "22:00:00",
  });
}
