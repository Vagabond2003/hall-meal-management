import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { format, addDays } from "date-fns";
import { calculateMonthlyBill } from "@/lib/billing";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    // 1. Get all active students with meal selection enabled
    const { data: students, error: studentError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("is_active", true)
      .eq("meal_selection_enabled", true);

    if (studentError) throw studentError;
    if (!students || students.length === 0) {
      return NextResponse.json({ message: "No active students found" });
    }

    const studentIds = students.map(s => s.id);

    // 2. Find their selections for today
    const { data: todaySelections, error: selectionError } = await supabaseAdmin
      .from("meal_selections")
      .select("student_id, meal_id")
      .in("student_id", studentIds)
      .eq("date", today)
      .eq("is_selected", true);

    if (selectionError) throw selectionError;
    if (!todaySelections || todaySelections.length === 0) {
      return NextResponse.json({ message: "No selections to carry over" });
    }

    // 3. Insert selections for tomorrow for each student if they don't already have one
    const newSelections = todaySelections.map(selection => ({
      student_id: selection.student_id,
      meal_id: selection.meal_id,
      date: tomorrow,
      is_selected: true
    }));

    const { error: insertError } = await supabaseAdmin
      .from("meal_selections")
      .upsert(newSelections, { 
        onConflict: "student_id,meal_id,date",
        ignoreDuplicates: true // Only insert if they haven't explicitly made a choice for tomorrow
      });

    if (insertError) throw insertError;

    // Recalculate billing for the affected students
    try {
      const [yearStr, monthStr] = tomorrow.split("-");
      await Promise.all(studentIds.map(id => calculateMonthlyBill(id, Number(monthStr), Number(yearStr))));
    } catch (billingErr) {
      console.error("Failed to recalculate billing for carryovers:", billingErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Carried over ${newSelections.length} selections for ${studentIds.length} students` 
    });

  } catch (error: any) {
    console.error("Meal carryover error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
