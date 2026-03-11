import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
    
    // Set all student meal selections to unselected for the new month onwards, stopping carry-over effect
    const { error: resetError } = await supabaseAdmin
      .from("meal_selections")
      .update({ is_selected: false })
      .gte("date", startDate);
      
    if (resetError) throw resetError;

    // Create empty MonthlyBilling records for all active students for the new month
    const { data: students } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("is_active", true);

    if (students && students.length > 0) {
      const billingRecords = students.map(s => ({
        student_id: s.id,
        month: currentMonth,
        year: currentYear,
        total_cost: 0,
        is_paid: false
      }));

      const { error: billingErr } = await supabaseAdmin
        .from("monthly_billing")
        .upsert(billingRecords, { onConflict: "student_id,month,year" });
        
      if (billingErr) throw billingErr;
    }

    return NextResponse.json({ success: true, message: "Month reset completed successfully" });
  } catch (error: any) {
    console.error("Month reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
