import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const mealParam = searchParams.get("meal");

  if (!dateParam || !mealParam) {
    return NextResponse.json(
      { error: "Date and meal are required" },
      { status: 400 }
    );
  }

  const mealLabel = mealLabels[mealParam.toLowerCase()];
  if (!mealLabel) {
    return NextResponse.json(
      { error: "Meal must be breakfast, lunch, or dinner" },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Validate date is not in the future
  const queryDate = new Date(dateParam + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (queryDate > today) {
    return NextResponse.json(
      { error: "Cannot generate report for future dates" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch meal selections for the date (no joins — avoid schema cache issues)
    const { data: selections, error: selError } = await supabaseAdmin
      .from("meal_selections")
      .select("student_id, weekly_menu_id, meal_id")
      .eq("date", dateParam)
      .eq("is_selected", true);

    if (selError) throw new Error(selError.message);

    if (!selections || selections.length === 0) {
      return NextResponse.json({
        date: dateParam,
        dateFormatted: formatDate(dateParam),
        meal: mealParam.toLowerCase(),
        mealLabel,
        students: [],
        totalCount: 0,
      });
    }

    // 2. Fetch weekly_menus and meals lookup tables to determine meal types
    const uniqueWeeklyMenuIds = [
      ...new Set(selections.map((s) => s.weekly_menu_id).filter(Boolean)),
    ];
    const uniqueMealIds = [
      ...new Set(selections.map((s) => s.meal_id).filter(Boolean)),
    ];

    const [weeklyMenusRes, mealsRes] = await Promise.all([
      uniqueWeeklyMenuIds.length > 0
        ? supabaseAdmin
            .from("weekly_menus")
            .select("id, meal_slot")
            .in("id", uniqueWeeklyMenuIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      uniqueMealIds.length > 0
        ? supabaseAdmin
            .from("meals")
            .select("id, name")
            .in("id", uniqueMealIds)
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

    // 3. Filter selections by meal type
    const matchingStudentIds = [
      ...new Set(
        selections
          .filter((sel: any) => {
            const slot =
              weeklyMenuMap.get(sel.weekly_menu_id) ||
              mealMap.get(sel.meal_id) ||
              "";
            return slot.toLowerCase() === mealLabel.toLowerCase();
          })
          .map((sel: any) => sel.student_id)
      ),
    ];

    if (matchingStudentIds.length === 0) {
      return NextResponse.json({
        date: dateParam,
        dateFormatted: formatDate(dateParam),
        meal: mealParam.toLowerCase(),
        mealLabel,
        students: [],
        totalCount: 0,
      });
    }

    // 4. Fetch student details
    const { data: students, error: userError } = await supabaseAdmin
      .from("users")
      .select("name, token_number, room_number")
      .in("id", matchingStudentIds)
      .order("name", { ascending: true });

    if (userError) throw new Error(userError.message);

    const formattedStudents = (students || []).map((u: any) => ({
      name: u.name || "—",
      token_number: u.token_number || "—",
      room_no: u.room_number?.trim() ? u.room_number.trim() : "—",
    }));

    return NextResponse.json({
      date: dateParam,
      dateFormatted: formatDate(dateParam),
      meal: mealParam.toLowerCase(),
      mealLabel,
      students: formattedStudents,
      totalCount: formattedStudents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
