import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { endOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  if (!monthParam || !yearParam) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const targetMonth = parseInt(monthParam, 10);
  const targetYear = parseInt(yearParam, 10);

  if (
    isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12 ||
    isNaN(targetYear) || targetYear < 2020 || targetYear > 2100
  ) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfTargetMonth = endOfMonth(startOfTargetMonth);

  const startDateStr = format(startOfTargetMonth, "yyyy-MM-dd");
  const endDateStr = format(endOfTargetMonth, "yyyy-MM-dd");

  try {
    // Fetch all approved students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("users")
      .select("id, name, token_number, rna_number, is_active, meal_selection_enabled")
      .eq("role", "student")
      .eq("is_approved", true)
      .order("name", { ascending: true });

    if (studentsError) throw new Error(studentsError.message);

    // Fetch meal selections with meal/weekly_menu info for the month
    const { data: selections, error: selectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select(
        `
        student_id,
        date,
        is_selected,
        weekly_menu_id,
        meal_id,
        weekly_menus:weekly_menu_id(meal_slot),
        meals:meal_id(name)
      `
      )
      .eq("is_selected", true)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (selectionsError) throw new Error(selectionsError.message);

    // Group selections by student_id, then by date
    const studentDateMap = new Map<
      string,
      Map<string, { breakfast: boolean; lunch: boolean; dinner: boolean }>
    >();

    const mealBreakdown = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };

    selections?.forEach((sel: any) => {
      const slot =
        sel.weekly_menus?.meal_slot || sel.meals?.name || "";
      const slotLower = String(slot).toLowerCase();

      let mealType: "breakfast" | "lunch" | "dinner" | null = null;
      if (slotLower === "breakfast") mealType = "breakfast";
      else if (slotLower === "lunch") mealType = "lunch";
      else if (slotLower === "dinner") mealType = "dinner";

      if (!mealType) return; // Skip special meals (snack, iftar, etc.)

      if (!studentDateMap.has(sel.student_id)) {
        studentDateMap.set(sel.student_id, new Map());
      }
      const dateMap = studentDateMap.get(sel.student_id)!;
      if (!dateMap.has(sel.date)) {
        dateMap.set(sel.date, { breakfast: false, lunch: false, dinner: false });
      }
      const dayMeals = dateMap.get(sel.date)!;
      dayMeals[mealType] = true;

      mealBreakdown[mealType]++;
      mealBreakdown.total++;
    });

    // Build student list
    const subscriberList = (students || []).map((student) => {
      const dateMap = studentDateMap.get(student.id);
      const mealDates = dateMap
        ? Array.from(dateMap.entries()).map(([date, meals]) => ({
            date,
            breakfast: meals.breakfast,
            lunch: meals.lunch,
            dinner: meals.dinner,
          }))
        : [];

      // Sort dates ascending
      mealDates.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const total_meals = mealDates.reduce(
        (sum, d) => sum + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0),
        0
      );

      return {
        id: student.id,
        name: student.name || "N/A",
        token_number: student.token_number || "N/A",
        rna_number: student.rna_number || "N/A",
        room_no: "N/A",
        meal_selection_enabled: student.meal_selection_enabled ?? true,
        status: (student.meal_selection_enabled ? "Active" : "Paused") as "Active" | "Paused",
        total_meals,
        has_breakfast: mealDates.some((d) => d.breakfast),
        has_lunch: mealDates.some((d) => d.lunch),
        has_dinner: mealDates.some((d) => d.dinner),
        meal_dates: mealDates,
      };
    });

    // Only include students who actually have meals this month
    const studentsWithMeals = subscriberList.filter((s) => s.total_meals > 0);
    const totalMealsCount = studentsWithMeals.reduce((sum, s) => sum + s.total_meals, 0);

    return NextResponse.json({
      students: studentsWithMeals,
      totalStudentsWithMeals: studentsWithMeals.length,
      totalMealsCount,
      mealBreakdown,
      month: targetMonth,
      year: targetYear,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch meal subscribers" },
      { status: 500 }
    );
  }
}
