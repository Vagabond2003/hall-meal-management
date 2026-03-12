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
    .select(
      `
        id,
        date,
        is_selected,
        student_id,
        meal_id,
        weekly_menu_id,
        price,
        weekly_menus ( id, week_start_date, day_of_week, meal_slot, items, price )
      `
    )
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
    console.error("GET /api/student/selections error:", error);
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
  const { meal_id, weekly_menu_id, date, is_selected } = body as {
    meal_id: string | null | undefined;
    weekly_menu_id: string | null | undefined;
    date: string | undefined;
    is_selected: boolean | undefined;
  };

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  if ((meal_id && weekly_menu_id) || (!meal_id && !weekly_menu_id)) {
    return NextResponse.json(
      { error: "Provide exactly one of meal_id (special) or weekly_menu_id (regular)" },
      { status: 400 }
    );
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
  if (weekly_menu_id) {
    const { data: weeklyMenu, error: weeklyMenuErr } = await supabaseAdmin
      .from("weekly_menus")
      .select("price")
      .eq("id", weekly_menu_id)
      .single();
    if (weeklyMenuErr) {
      return NextResponse.json({ error: weeklyMenuErr.message }, { status: 500 });
    }
    mealPrice = Number(weeklyMenu?.price ?? 0);
  } else if (meal_id) {
    const { data: mealData, error: mealErr } = await supabaseAdmin
      .from("meals")
      .select("price")
      .eq("id", meal_id)
      .single();
    if (mealErr) {
      return NextResponse.json({ error: mealErr.message }, { status: 500 });
    }
    mealPrice = Number(mealData?.price ?? 0);
  }

  const selectionMatch = weekly_menu_id
    ? { student_id: session.user.id, weekly_menu_id, date }
    : { student_id: session.user.id, meal_id: meal_id!, date };

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("meal_selections")
    .select("id")
    .match(selectionMatch)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  const payload = {
    student_id: session.user.id,
    date,
    is_selected: is_selected ?? true,
    price: mealPrice,
    meal_id: meal_id ?? null,
    weekly_menu_id: weekly_menu_id ?? null,
  };

  const { error } = existing?.id
    ? await supabaseAdmin.from("meal_selections").update(payload).eq("id", existing.id)
    : await supabaseAdmin.from("meal_selections").insert(payload);

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
