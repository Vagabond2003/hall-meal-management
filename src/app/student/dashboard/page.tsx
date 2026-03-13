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

  // Parallel fetches — note: we no longer use the meals table for display
  const [selectionsRes, settingsRes, userRes] = await Promise.all([
    supabaseAdmin
      .from("meal_selections")
      .select("id, date, is_selected, meal_id, price, meals(id, name, description, price, meal_type, date)")
      .eq("student_id", session.user.id)
      .eq("is_selected", true),
    supabaseAdmin.from("settings").select("meal_selection_deadline").limit(1).single(),
    supabaseAdmin
      .from("users")
      .select("name, token_number, meal_selection_enabled, is_active, is_approved, created_at")
      .eq("id", session.user.id)
      .single(),
  ]);

  const allSelections = selectionsRes.data ?? [];
  const deadline = settingsRes.data?.meal_selection_deadline ?? "22:00:00";
  const user = userRes.data;

  // Current month stats
  const monthSelections = allSelections.filter((s) => s.date >= startDate && s.date <= endDate);
  const totalMeals = monthSelections.length;
  const totalCost = monthSelections.reduce((acc, s) => {
    return acc + Number(s.price ?? 0);
  }, 0);

  // Days active = unique dates with selections this month
  const uniqueDays = new Set(monthSelections.map((s) => s.date)).size;

  // Deadline check
  const [dh, dm] = deadline.split(":").map(Number);
  const deadlineDisplay = `${dh > 12 ? dh - 12 : dh}:${String(dm).padStart(2, "0")} ${dh >= 12 ? "PM" : "AM"}`;
  const mealSelectionEnabled = user?.meal_selection_enabled ?? true;
  const currentMonthName = format(now, "MMMM yyyy");

  return (
    <DashboardClient
      userName={user?.name?.split(" ")[0] ?? session.user.name?.split(" ")[0] ?? "Student"}
      tokenNumber={user?.token_number ?? ""}
      totalMeals={totalMeals}
      totalCost={totalCost}
      uniqueDays={uniqueDays}
      isActive={user?.is_active ?? true}
      isApproved={user?.is_approved ?? false}
      mealSelectionEnabled={mealSelectionEnabled}
      deadline={deadlineDisplay}
      currentMonthName={currentMonthName}
    />
  );
}
