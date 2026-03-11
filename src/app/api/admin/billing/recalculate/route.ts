import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateMonthlyBill } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const month = body.month || new Date().getMonth() + 1;
    const year = body.year || new Date().getFullYear();

    const { data: students, error: studentError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("is_active", true);

    if (studentError) throw studentError;

    let successCount = 0;
    for (const student of students || []) {
      await calculateMonthlyBill(student.id, month, year);
      successCount++;
    }

    return NextResponse.json({ success: true, message: `Recalculated billing for ${successCount} active students in ${month}/${year}.` });
  } catch (error: any) {
    console.error("Recalculate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
