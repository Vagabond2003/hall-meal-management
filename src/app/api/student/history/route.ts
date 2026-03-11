import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = supabaseAdmin
    .from("meal_selections")
    .select(`
      id,
      date,
      is_selected,
      student_id,
      meal_id,
      meals ( id, name, description, price, meal_type )
    `)
    .eq("student_id", session.user.id)
    .eq("is_selected", true);

  if (month && year) {
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = format(endOfMonth(new Date(Number(year), Number(month) - 1)), "yyyy-MM-dd");
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
