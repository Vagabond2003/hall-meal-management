import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const startDate = format(startOfMonth(now), "yyyy-MM-dd");
  const endDate = format(endOfMonth(now), "yyyy-MM-dd");

  // Parallel fetches
  const [selectionsRes, mealsRes, settingsRes, userRes] = await Promise.all([
    supabaseAdmin
      .from("meal_selections")
      .select("id, date, is_selected, meal_id, meals(id, name, description, price, meal_type, date)")
      .eq("student_id", session.user.id)
      .eq("is_selected", true),
    supabaseAdmin.from("meals").select("*").eq("is_active", true),
    supabaseAdmin.from("settings").select("meal_selection_deadline").limit(1).single(),
    supabaseAdmin
      .from("users")
      .select("name, rna_number, meal_selection_enabled, is_active, is_approved, created_at")
      .eq("id", session.user.id)
      .single(),
  ]);

  const allSelections = selectionsRes.data ?? [];
  const meals = mealsRes.data ?? [];
  const deadline = settingsRes.data?.meal_selection_deadline ?? "22:00:00";
  const user = userRes.data;

  // Current month stats
  const monthSelections = allSelections.filter((s) => s.date >= startDate && s.date <= endDate);
  const totalMeals = monthSelections.length;
  const totalCost = monthSelections.reduce((acc, s) => {
    const meal = Array.isArray(s.meals) ? s.meals[0] : s.meals;
    return acc + Number((meal as { price?: number })?.price ?? 0);
  }, 0);

  // Days active = unique dates with selections this month
  const uniqueDays = new Set(monthSelections.map((s) => s.date)).size;

  // Today's selections by meal_id
  const todaySelections = allSelections.filter((s) => s.date === today);
  const selectedMealIds = new Set(todaySelections.map((s) => s.meal_id));

  // Regular meals mapped with weekly_menus
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data: todayMenus } = await supabaseAdmin
    .from("weekly_menus")
    .select("meal_slot, items, price")
    .eq("week_start_date", weekStartStr)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  const regularMeals = meals.filter((m) => m.meal_type === "regular").map((m) => {
    const slot = todayMenus?.find(tm => tm.meal_slot.toLowerCase() === m.name.toLowerCase());
    if (slot) {
      return { ...m, description: slot.items, price: slot.price, hasMenu: true };
    }
    return { ...m, hasMenu: false };
  });

  // Special meals for today or upcoming (within 7 days)
  const upcomingDate = format(new Date(now.getTime() + 7 * 86400000), "yyyy-MM-dd");
  const specialMeals = meals.filter(
    (m) => m.meal_type === "special" && m.date && m.date >= today && m.date <= upcomingDate
  );

  // Deadline check
  const [dh, dm] = deadline.split(":").map(Number);
  const deadlineTime = new Date();
  deadlineTime.setHours(dh, dm, 0, 0);
  const isPastDeadline = now > deadlineTime;

  const deadlineDisplay = `${dh > 12 ? dh - 12 : dh}:${String(dm).padStart(2, "0")} ${dh >= 12 ? "PM" : "AM"}`;
  const mealSelectionEnabled = user?.meal_selection_enabled ?? true;
  const currentMonthName = format(now, "MMMM yyyy");

  return (
    <DashboardClient
      userName={user?.name?.split(" ")[0] ?? session.user.name?.split(" ")[0] ?? "Student"}
      rnaNumber={user?.rna_number ?? ""}
      totalMeals={totalMeals}
      totalCost={totalCost}
      uniqueDays={uniqueDays}
      isActive={user?.is_active ?? true}
      isApproved={user?.is_approved ?? false}
      mealSelectionEnabled={mealSelectionEnabled}
      regularMeals={regularMeals}
      specialMeals={specialMeals}
      selectedMealIds={[...selectedMealIds]}
      today={today}
      deadline={deadlineDisplay}
      isPastDeadline={isPastDeadline}
      currentMonthName={currentMonthName}
    />
  );
}
