import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format, endOfMonth, subMonths, startOfMonth, parseISO, isBefore, isAfter, isEqual } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  
  // Default to current month/year if not provided
  const targetYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const targetMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  
  const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfTargetMonth = endOfMonth(startOfTargetMonth);
  
  const startDateStr = format(startOfTargetMonth, "yyyy-MM-dd");
  const endDateStr = format(endOfTargetMonth, "yyyy-MM-dd");

  try {
    // 1. Fetch data for Current Month (Stats, Daily Participation, Popular Meals)
    const { data: monthSelections, error: monthError } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id, 
        date, 
        price, 
        student_id,
        weekly_menu_id,
        weekly_menus(meal_slot)
      `)
      .eq("is_selected", true)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (monthError) throw new Error(monthError.message);

    // 2. Fetch all Active Students (Active = true, Approved = true)
    const { data: activeStudentsData, error: activeStudentsError } = await supabaseAdmin
      .from("users")
      .select("id, created_at")
      .eq("role", "student")
      .eq("is_approved", true);
      // Wait, student growth needs all approved students, stats needs active ones
      // Let's fetch all approved, filter active locally for stat card if needed. But we can't get is_active if we don't select it.
    
    // Let's re-fetch users with is_active
    const { data: allApprovedStudents, error: studentsError } = await supabaseAdmin
      .from("users")
      .select("id, created_at, is_active")
      .eq("role", "student")
      .eq("is_approved", true);

    if (studentsError) throw new Error(studentsError.message);

    const activeStudentsCount = allApprovedStudents.filter(s => s.is_active).length;

    // Calculate Stats
    const totalMeals = monthSelections?.length || 0;
    const totalRevenue = monthSelections?.reduce((sum, row) => sum + (Number(row.price) || 0), 0) || 0;
    const avgMealsPerStudent = activeStudentsCount > 0 ? (totalMeals / activeStudentsCount) : 0;

    // Calculate Daily Participation
    const dailyMap = new Map<string, Set<string>>();
    // Initialize all days in month
    const daysInMonth = endOfTargetMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap.set(String(i), new Set<string>());
    }

    monthSelections?.forEach(sel => {
      // date is YYYY-MM-DD
      const day = parseInt(sel.date.split("-")[2], 10);
      const dayStr = String(day);
      if (dailyMap.has(dayStr)) {
        dailyMap.get(dayStr)!.add(sel.student_id);
      }
    });

    const dailyParticipation = Array.from(dailyMap.entries()).map(([day, students]) => ({
      day: parseInt(day, 10),
      count: students.size
    })).sort((a, b) => a.day - b.day);

    // Calculate Popular Meals
    const mealCounts = new Map<string, number>();
    monthSelections?.forEach(sel => {
      const menu = sel.weekly_menus as any;
      const mealName = menu?.meal_slot;
      if (mealName) {
        mealCounts.set(mealName, (mealCounts.get(mealName) || 0) + 1);
      }
    });

    const popularMeals = Array.from(mealCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate Peak Meal Days by Day of Week
    const dayCounts = new Array(7).fill(0);
    monthSelections?.forEach(sel => {
      const dateObj = parseISO(sel.date);
      dayCounts[dateObj.getDay()]++;
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // Order results: Monday -> Sunday
    const orderedIndices = [1, 2, 3, 4, 5, 6, 0];
    const peakMealDays = orderedIndices.map(dayIdx => ({
      day: dayNames[dayIdx],
      count: dayCounts[dayIdx]
    }));

    // 3. Fetch data for Last 6 Months Trends
    const sixMonthsAgoStart = startOfMonth(subMonths(now, 5)); // 6 months inclusive
    const sixMonthsAgoStr = format(sixMonthsAgoStart, "yyyy-MM-dd");

    const { data: trendSelections, error: trendError } = await supabaseAdmin
      .from("meal_selections")
      .select("date, price")
      .eq("is_selected", true)
      .gte("date", sixMonthsAgoStr);

    if (trendError) throw new Error(trendError.message);

    // Generate last 6 months list
    const last6Months: { label: string; datePrefix: string; endOfThatMonth: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(now, i);
      last6Months.push({
        label: format(targetMonth, "MMM yyyy"), // e.g. "Oct 2023"
        datePrefix: format(targetMonth, "yyyy-MM"), // e.g. "2023-10"
        endOfThatMonth: endOfMonth(targetMonth)
      });
    }

    // Monthly Revenue
    const monthlyRevenueMap = new Map<string, number>();
    last6Months.forEach(m => monthlyRevenueMap.set(m.label, 0));

    trendSelections?.forEach(sel => {
      const prefix = sel.date.substring(0, 7); // yyyy-MM
      const monthDef = last6Months.find(m => m.datePrefix === prefix);
      if (monthDef) {
        monthlyRevenueMap.set(monthDef.label, monthlyRevenueMap.get(monthDef.label)! + (Number(sel.price) || 0));
      }
    });

    const monthlyRevenue = last6Months.map(m => ({
      month: m.label,
      revenue: monthlyRevenueMap.get(m.label) || 0
    }));

    // Student Growth (Cumulative count up to that month)
    const studentGrowth = last6Months.map(m => {
      // count students created <= end of this month
      const count = allApprovedStudents.filter(student => parseISO(student.created_at) <= m.endOfThatMonth).length;
      return {
        month: m.label,
        count
      };
    });

    return NextResponse.json({
      stats: {
        totalMeals,
        totalRevenue,
        activeStudents: activeStudentsCount,
        avgMealsPerStudent: Number(avgMealsPerStudent.toFixed(1))
      },
      dailyParticipation,
      popularMeals,
      peakMealDays,
      monthlyRevenue,
      studentGrowth
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
