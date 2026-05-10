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
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  const targetMonth = parseInt(monthParam, 10);
  const targetYear = parseInt(yearParam, 10);

  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfTargetMonth = endOfMonth(startOfTargetMonth);

  const startDateStr = format(startOfTargetMonth, "yyyy-MM-dd");
  const endDateStr = format(endOfTargetMonth, "yyyy-MM-dd");

  try {
    // Fetch all approved students with their profiles
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("users")
      .select("id, name, token_number, rna_number, is_active, meal_selection_enabled, created_at")
      .eq("role", "student")
      .eq("is_approved", true)
      .order("name", { ascending: true });

    if (studentsError) throw new Error(studentsError.message);

    if (!students || students.length === 0) {
      return NextResponse.json({
        students: [],
        totalStudentsWithMeals: 0,
        totalMealsCount: 0,
      });
    }

    // Fetch all meal selections for the target month
    const { data: selections, error: selectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select("student_id, is_selected")
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (selectionsError) throw new Error(selectionsError.message);

    // Count selections per student
    const mealCountMap = new Map<string, number>();
    selections?.forEach((sel) => {
      const count = mealCountMap.get(sel.student_id) || 0;
      mealCountMap.set(sel.student_id, count + 1);
    });

    // Build subscriber list
    const subscribers = students.map((student) => {
      const mealCount = mealCountMap.get(student.id) || 0;
      const hasMeals = mealCount > 0;

      let status: "active" | "paused" | "inactive" = "inactive";
      if (student.is_active && student.meal_selection_enabled && hasMeals) {
        status = "active";
      } else if (student.is_active && hasMeals) {
        status = "paused";
      } else if (student.is_active) {
        status = "active";
      }

      return {
        id: student.id,
        name: student.name,
        token_number: student.token_number || "N/A",
        rna_number: student.rna_number || "N/A",
        room_no: "N/A", // Reserved for future schema addition
        meals_this_month: mealCount,
        status,
        is_active: student.is_active,
        meal_selection_enabled: student.meal_selection_enabled,
      };
    });

    const totalStudentsWithMeals = subscribers.filter((s) => s.meals_this_month > 0).length;
    const totalMealsCount = subscribers.reduce((sum, s) => sum + s.meals_this_month, 0);

    return NextResponse.json({
      students: subscribers,
      totalStudentsWithMeals,
      totalMealsCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch meal subscribers" },
      { status: 500 }
    );
  }
}
