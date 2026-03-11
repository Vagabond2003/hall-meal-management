import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    // 1. Fetch Meal Selections for the given month/year
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: selectionsData } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        date,
        is_selected,
        meals (
          id,
          name,
          description,
          price
        )
      `)
      .eq("student_id", id)
      .eq("is_selected", true)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    // Format selections
    const formattedSelections = selectionsData?.map(s => {
      const meals: any = s.meals;
      return {
        id: s.id,
        date: s.date,
        meal_name: Array.isArray(meals) ? meals[0]?.name : meals?.name || "Unknown",
        items: Array.isArray(meals) ? meals[0]?.description : meals?.description,
        cost: Array.isArray(meals) ? meals[0]?.price : meals?.price
      };
    }) || [];

    // 2. Fetch Billing Records (all time)
    const { data: billingData } = await supabaseAdmin
      .from("monthly_billing")
      .select("*")
      .eq("student_id", id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    // 3. Fetch Today's Selections
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySelectionsData } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        date,
        is_selected,
        meals (
          id,
          name,
          description,
          price
        )
      `)
      .eq("student_id", id)
      .eq("is_selected", true)
      .eq("date", today);

    const formattedTodaySelections = todaySelectionsData?.map(s => {
      const meals: any = s.meals;
      return {
        id: s.id,
        date: s.date,
        meal_name: Array.isArray(meals) ? meals[0]?.name : meals?.name || "Unknown",
        items: Array.isArray(meals) ? meals[0]?.description : meals?.description,
        cost: Array.isArray(meals) ? meals[0]?.price : meals?.price
      };
    }) || [];

    return NextResponse.json({ 
      selections: formattedSelections,
      billing: billingData || [],
      todaySelections: formattedTodaySelections
    });

  } catch (error) {
    console.error("Student details fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
