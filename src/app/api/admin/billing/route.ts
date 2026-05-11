import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const now = new Date();
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const status = searchParams.get("status") || "all";
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("monthly_billing")
      .select(
        `
        id,
        student_id,
        month,
        year,
        total_cost,
        is_paid,
        created_at,
        users(name, email, token_number)
      `
      )
      .eq("month", month)
      .eq("year", year);

    if (status === "paid") {
      query = query.eq("is_paid", true);
    } else if (status === "unpaid") {
      query = query.eq("is_paid", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Billing fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch billing" }, { status: 500 });
    }

    let records = (data || []).map((item: any) => ({
      id: item.id,
      student_id: item.student_id,
      month: item.month,
      year: item.year,
      total_cost: Number(item.total_cost || 0),
      is_paid: item.is_paid,
      created_at: item.created_at,
      name: item.users?.name || "Unknown",
      email: item.users?.email || "",
      token_number: item.users?.token_number || "",
    }));

    // Client-side search
    if (q) {
      records = records.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.token_number && r.token_number.toLowerCase().includes(q)) ||
          r.email.toLowerCase().includes(q)
      );
    }

    // Client-side sort by name
    records.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ billing: records });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
