import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format, endOfMonth } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = format(endOfMonth(new Date(Number(year), Number(month) - 1)), "yyyy-MM-dd");

    // Fetch selections
    const { data: selections, error: selectionsError } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        date,
        is_selected,
        meal_id,
        weekly_menu_id,
        price,
        weekly_menus ( id, week_start_date, day_of_week, meal_slot, items, price )
      `)
      .eq("student_id", id)
      .eq("is_selected", true)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (selectionsError) throw selectionsError;

    // Fetch billing record
    const { data: billing, error: billingError } = await supabaseAdmin
      .from("monthly_billing")
      .select("*")
      .eq("student_id", id)
      .eq("month", Number(month))
      .eq("year", Number(year))
      .maybeSingle();

    if (billingError && billingError.code !== 'PGRST116') throw billingError;

    // Fetch student data for report
    const { data: student, error: studentError } = await supabaseAdmin
      .from("users")
      .select("id, name, rna_number, created_at")
      .eq("id", id)
      .single();
    
    if (studentError) throw studentError;

    return NextResponse.json({ 
      student,
      selections: selections || [],
      billing: billing || null 
    });

  } catch (error: any) {
    console.error("Fetch report error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch report data" }, { status: 500 });
  }
}
