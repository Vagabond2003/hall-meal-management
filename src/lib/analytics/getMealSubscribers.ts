import { supabaseAdmin } from "@/lib/supabase";
import { endOfMonth, format } from "date-fns";

interface MealDate {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface Student {
  id: string;
  name: string;
  token_number: string;
  room_number: string;
  meal_selection_enabled: boolean;
  status: "Active" | "Paused";
  total_meals: number;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  meal_dates: MealDate[];
}

export interface MealSubscribersData {
  students: Student[];
  totalStudentsWithMeals: number;
  totalMealsCount: number;
  mealBreakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;
  };
  month: number;
  year: number;
}

export async function getMealSubscribers(
  month: number,
  year: number
): Promise<MealSubscribersData> {
  const startOfTargetMonth = new Date(year, month - 1, 1);
  const endOfTargetMonth = endOfMonth(startOfTargetMonth);

  const startDateStr = format(startOfTargetMonth, "yyyy-MM-dd");
  const endDateStr = format(endOfTargetMonth, "yyyy-MM-dd");

  // Fetch all approved students
  const { data: students, error: studentsError } = await supabaseAdmin
    .from("users")
    .select("id, name, token_number, room_number, is_active, meal_selection_enabled")
    .eq("role", "student")
    .eq("is_approved", true)
    .order("name", { ascending: true });

  if (studentsError) throw new Error(studentsError.message);

  // Fetch meal selections for the month (no joins — avoid PostgREST schema cache issues)
  const { data: selections, error: selectionsError } = await supabaseAdmin
    .from("meal_selections")
    .select("student_id, date, is_selected, weekly_menu_id, meal_id")
    .eq("is_selected", true)
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  if (selectionsError) throw new Error(selectionsError.message);

  // Fetch weekly_menus and meals lookup tables in parallel
  const uniqueWeeklyMenuIds = [
    ...new Set((selections || []).map((s: any) => s.weekly_menu_id).filter(Boolean)),
  ];
  const uniqueMealIds = [
    ...new Set((selections || []).map((s: any) => s.meal_id).filter(Boolean)),
  ];

  const [weeklyMenusRes, mealsRes] = await Promise.all([
    uniqueWeeklyMenuIds.length > 0
      ? supabaseAdmin.from("weekly_menus").select("id, meal_slot").in("id", uniqueWeeklyMenuIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    uniqueMealIds.length > 0
      ? supabaseAdmin.from("meals").select("id, name").in("id", uniqueMealIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  if (weeklyMenusRes.error) throw new Error(weeklyMenusRes.error.message);
  if (mealsRes.error) throw new Error(mealsRes.error.message);

  const weeklyMenuMap = new Map<string, string>(
    (weeklyMenusRes.data || []).map((wm: any) => [wm.id, wm.meal_slot])
  );
  const mealMap = new Map<string, string>(
    (mealsRes.data || []).map((m: any) => [m.id, m.name])
  );

  // Group selections by student_id, then by date
  const studentDateMap = new Map<
    string,
    Map<string, { breakfast: boolean; lunch: boolean; dinner: boolean }>
  >();

  const mealBreakdown = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };

  (selections || []).forEach((sel: any) => {
    const slot =
      weeklyMenuMap.get(sel.weekly_menu_id) ||
      mealMap.get(sel.meal_id) ||
      "";
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
  const subscriberList: Student[] = (students || []).map((student: any) => {
    const dateMap = studentDateMap.get(student.id);
    const mealDates: MealDate[] = dateMap
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
      (sum, d) =>
        sum + (d.breakfast ? 1 : 0) + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0),
      0
    );

    return {
      id: student.id,
      name: student.name || "—",
      token_number: student.token_number || "—",
      room_number: student.room_number?.trim()
        ? student.room_number.trim()
        : "—",
      meal_selection_enabled: student.meal_selection_enabled ?? true,
      status: (student.meal_selection_enabled
        ? "Active"
        : "Paused") as "Active" | "Paused",
      total_meals,
      has_breakfast: mealDates.some((d) => d.breakfast),
      has_lunch: mealDates.some((d) => d.lunch),
      has_dinner: mealDates.some((d) => d.dinner),
      meal_dates: mealDates,
    };
  });

  // Only include students who actually have meals this month
  const studentsWithMeals = subscriberList.filter((s) => s.total_meals > 0);
  const totalMealsCount = studentsWithMeals.reduce(
    (sum, s) => sum + s.total_meals,
    0
  );

  return {
    students: studentsWithMeals,
    totalStudentsWithMeals: studentsWithMeals.length,
    totalMealsCount,
    mealBreakdown,
    month,
    year,
  };
}
