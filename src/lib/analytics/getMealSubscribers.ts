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
  rna_number: string;
  room_no: string;
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

  (selections || []).forEach((sel: any) => {
    const slot = sel.weekly_menus?.meal_slot || sel.meals?.name || "";
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
      name: student.name || "N/A",
      token_number: student.token_number || "N/A",
      rna_number: student.rna_number || "N/A",
      room_no: "N/A",
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
