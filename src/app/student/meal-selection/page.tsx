import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import MealSelectionWrapper from "./MealSelectionWrapper";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MealSelectionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get today's date in Bangladesh timezone: YYYY-MM-DD
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  
  // Compute day of week in Bangladesh time
  const bangladeshTimeObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const currentDayOfWeek = bangladeshTimeObj.getDay(); // 0-6
  
  // Calculate Sunday of current week
  const sundayObj = new Date(bangladeshTimeObj);
  sundayObj.setDate(bangladeshTimeObj.getDate() - currentDayOfWeek);
  
  const sundayYear = sundayObj.getFullYear();
  const sundayMonth = String(sundayObj.getMonth() + 1).padStart(2, "0");
  const sundayDate = String(sundayObj.getDate()).padStart(2, "0");
  const sundayStr = `${sundayYear}-${sundayMonth}-${sundayDate}`;

  // Fetch menu and selections in parallel
  const [{ data: menus }, { data: selections }] = await Promise.all([
    supabaseAdmin
      .from("weekly_menus")
      .select("id, meal_slot, items, price")
      .eq("week_start_date", sundayStr)
      .eq("day_of_week", currentDayOfWeek)
      .eq("is_active", true),
    supabaseAdmin
      .from("meal_selections")
      .select("weekly_menu_id, meal_id")
      .eq("student_id", session.user.id)
      .eq("date", dateStr)
      .eq("is_selected", true)
  ]);

  const selectedIds = selections
    ? selections.map(s => s.weekly_menu_id || s.meal_id).filter(Boolean) as string[]
    : [];

  return (
    <MealSelectionWrapper 
      dailyMenus={menus || []} 
      dailySelectedIds={selectedIds} 
      todayStr={dateStr} 
    />
  );
}
