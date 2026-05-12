import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { format, addDays } from "date-fns";
import { calculateMonthlyBill } from "@/lib/billing";

const BATCH_SIZE = 100;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const { count: totalStudentCount, error: countError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_active", true)
      .eq("meal_selection_enabled", true);

    if (countError) throw countError;

    const totalStudents = totalStudentCount ?? 0;
    if (totalStudents === 0) {
      return NextResponse.json({ message: "No active students found" });
    }

    const totalChunks = Math.max(1, Math.ceil(totalStudents / BATCH_SIZE));

    const allTodaySelections: { student_id: string; meal_id: string }[] = [];
    let from = 0;
    let chunkIndex = 0;

    while (true) {
      const { data: students, error: studentError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("meal_selection_enabled", true)
        .range(from, from + BATCH_SIZE - 1);

      if (studentError) throw studentError;
      if (!students || students.length === 0) break;

      chunkIndex += 1;
      const chunkIds = students.map((s) => s.id);

      const { data: selections, error: selectionError } = await supabaseAdmin
        .from("meal_selections")
        .select("student_id, meal_id")
        .in("student_id", chunkIds)
        .eq("date", today)
        .eq("is_selected", true);

      if (selectionError) throw selectionError;

      if (!selections?.length) {
        console.log(
          `[meal-carryover] Processed chunk ${chunkIndex} of ${totalChunks} (0 selections, skip)`
        );
      } else {
        allTodaySelections.push(...selections);
        console.log(
          `[meal-carryover] Processed chunk ${chunkIndex} of ${totalChunks} (${selections.length} selections)`
        );
      }

      if (students.length < BATCH_SIZE) break;
      from += BATCH_SIZE;
    }

    if (allTodaySelections.length === 0) {
      return NextResponse.json({ message: "No selections to carry over" });
    }

    const newSelections = allTodaySelections.map((selection) => ({
      student_id: selection.student_id,
      meal_id: selection.meal_id,
      date: tomorrow,
      is_selected: true,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("meal_selections")
      .upsert(newSelections, {
        onConflict: "student_id,meal_id,date",
        ignoreDuplicates: true,
      });

    if (insertError) throw insertError;

    const affectedIds = [
      ...new Set(allTodaySelections.map((s) => s.student_id)),
    ];
    const [yearStr, monthStr] = tomorrow.split("-");

    try {
      for (let i = 0; i < affectedIds.length; i += BATCH_SIZE) {
        const chunk = affectedIds.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map((id) =>
            calculateMonthlyBill(id, Number(monthStr), Number(yearStr))
          )
        );
        console.log(
          `[meal-carryover] Recalculated billing for batch ${Math.floor(i / BATCH_SIZE) + 1} (affected students)`
        );
      }
    } catch (billingErr) {
      console.error("Failed to recalculate billing for carryovers:", billingErr);
    }

    return NextResponse.json({
      success: true,
      message: `Carried over ${newSelections.length} selections for ${affectedIds.length} students`,
    });
  } catch (error: any) {
    console.error("Meal carryover error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
