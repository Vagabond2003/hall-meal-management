import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format } from "date-fns";
import { calculateMonthlyBill } from "@/lib/billing";

// GET /api/student/selections?date=YYYY-MM-DD
// Returns meal_selections for the student for a given date (defaults to today)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = supabaseAdmin
    .from("meal_selections")
    .select(`id, date, is_selected, student_id, meal_id, price, meals ( id, name, description, price, meal_type, date )`)
    .eq("student_id", session.user.id)
    .eq("is_selected", true);

  if (month && year) {
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = new Date(Number(year), Number(month), 0); // last day of month
    query = query.gte("date", startDate).lte("date", format(endDate, "yyyy-MM-dd"));
  } else {
    query = query.eq("date", date);
  }

  const { data, error } = await query.order("date");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ selections: data ?? [] });
}

// POST /api/student/selections — toggle a meal selection on/off for today
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.meal_selection_enabled) {
    return NextResponse.json({ error: "Meal selection is disabled for your account" }, { status: 403 });
  }

  const body = await request.json();
  const { meal_id, date, is_selected } = body;

  if (!meal_id || !date) {
    return NextResponse.json({ error: "meal_id and date are required" }, { status: 400 });
  }

  // Check deadline
  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("meal_selection_deadline")
    .limit(1)
    .single();

  const deadline = settings?.meal_selection_deadline ?? "22:00:00";
  const now = new Date();
  const [dh, dm] = deadline.split(":").map(Number);
  const deadlineToday = new Date();
  deadlineToday.setHours(dh, dm, 0, 0);

  // Only enforce deadline for today's date
  const today = format(now, "yyyy-MM-dd");
  if (date === today && now > deadlineToday) {
    return NextResponse.json({ error: "Today's selection deadline has passed" }, { status: 403 });
  }

  // Securely determine the price
  let mealPrice = 0;
  
  const { data: mealData } = await supabaseAdmin
    .from("meals")
    .select("name, price, meal_type")
    .eq("id", meal_id)
    .single();

  if (mealData) {
    if (mealData.meal_type === "regular") {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const { data: weeklyMenu } = await supabaseAdmin
        .from("weekly_menus")
        .select("price")
        .eq("week_start_date", weekStartStr)
        .eq("day_of_week", dayOfWeek)
        .ilike("meal_slot", mealData.name)
        .single();
      
      if (weeklyMenu) {
        mealPrice = weeklyMenu.price;
      }
    } else {
      mealPrice = mealData.price;
    }
  }

  // Upsert the selection with the price
  const { error } = await supabaseAdmin
    .from("meal_selections")
    .upsert(
      {
        student_id: session.user.id,
        meal_id,
        date,
        is_selected: is_selected ?? true,
        price: mealPrice,
      },
      { onConflict: "student_id,meal_id,date" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate billing
  try {
    const [yearStr, monthStr] = date.split("-");
    await calculateMonthlyBill(session.user.id, Number(monthStr), Number(yearStr));
  } catch (billingErr) {
    console.error("Failed to recalculate bill:", billingErr);
  }

  return NextResponse.json({ success: true });
}
