import { supabaseAdmin } from "./supabase";

export async function calculateMonthlyBill(studentId: string, month: number, year: number) {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const endDateStr = `${year}-${month.toString().padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}`;

  const { data: selections, error: fetchError } = await supabaseAdmin
    .from("meal_selections")
    .select(`
      meals ( price )
    `)
    .eq("student_id", studentId)
    .eq("is_selected", true)
    .gte("date", startDate)
    .lte("date", endDateStr);

  let totalCost = 0;
  if (selections) {
    totalCost = selections.reduce((sum, sel: any) => sum + Number(sel.meals?.price || 0), 0);
  }

  // Fetch existing billing to preserve is_paid status if it exists
  const { data: existingBilling } = await supabaseAdmin
    .from("monthly_billing")
    .select("is_paid")
    .eq("student_id", studentId)
    .eq("month", month)
    .eq("year", year)
    .single();

  const { error: upsertError } = await supabaseAdmin
    .from("monthly_billing")
    .upsert({
      student_id: studentId,
      month,
      year,
      total_cost: totalCost,
      is_paid: existingBilling?.is_paid ?? false
    }, {
      onConflict: "student_id,month,year"
    });

  if (upsertError) {
    console.error("Error upserting monthly billing for student", studentId, upsertError);
  }
  
  return totalCost;
}
