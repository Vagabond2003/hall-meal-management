import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  
  // Use Bangladesh timezone logic for defaults
  const bangladeshTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const bangladeshDate = new Date(bangladeshTimeStr);
  
  const month = searchParams.get("month") || String(bangladeshDate.getMonth() + 1).padStart(2, "0");
  const year = searchParams.get("year") || String(bangladeshDate.getFullYear());

  const yearNum = Number(year);
  const monthNum = Number(month);

  const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const endDateObj = new Date(yearNum, monthNum, 0);
  const endDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

  try {
    // 1. Fetch all active students
    const { data: students, error: studentsErr } = await supabaseAdmin
      .from("users")
      .select("id, name, token_number")
      .eq("role", "student")
      .eq("is_approved", true).eq("is_active", true);

    if (studentsErr) throw new Error(studentsErr.message);
    if (!students || students.length === 0) {
      return NextResponse.json({ summary: [] });
    }

    // 2. Fetch all meal selections for the month where is_selected = true
    const { data: selections, error: selectionsErr } = await supabaseAdmin
      .from("meal_selections")
      .select("student_id, price")
      .eq("is_selected", true)
      .gte("date", startDate)
      .lte("date", endDate);

    if (selectionsErr) throw new Error(selectionsErr.message);

    // 3. Fetch all monthly billing records for the month
    const { data: billing, error: billingErr } = await supabaseAdmin
      .from("monthly_billing")
      .select("student_id, is_paid")
      .eq("month", monthNum)
      .eq("year", yearNum);

    if (billingErr) throw new Error(billingErr.message);

    // Group billing by student_id
    const billingMap = new Map<string, boolean>();
    billing?.forEach(b => {
      billingMap.set(b.student_id, b.is_paid || false);
    });

    // Group selections by student_id
    const selectionsMap = new Map<string, { count: number; total: number }>();
    selections?.forEach(s => {
      const current = selectionsMap.get(s.student_id) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(s.price || 0);
      selectionsMap.set(s.student_id, current);
    });

    // Map everything together
    const summary = students.map(student => {
      const selData = selectionsMap.get(student.id) || { count: 0, total: 0 };
      const isPaid = billingMap.get(student.id) || false;
      
      return {
        token_number: student.token_number || "-",
        name: student.name,
        meals_consumed: selData.count,
        total_bill: selData.total,
        payment_status: isPaid ? "paid" : "unpaid"
      };
    });

    // Sort by token_number ascending (lexicographical string sort is usually fine for tokens, but we pad it if it's numeric-like)
    summary.sort((a, b) => {
      const aMatch = String(a.token_number).match(/(\d+)/);
      const bMatch = String(b.token_number).match(/(\d+)/);
      if (aMatch && bMatch) {
         return Number(aMatch[0]) - Number(bMatch[0]);
      }
      return String(a.token_number).localeCompare(String(b.token_number));
    });

    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
