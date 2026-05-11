import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, is_paid } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No records selected" }, { status: 400 });
    }

    if (typeof is_paid !== "boolean") {
      return NextResponse.json({ error: "Invalid is_paid value" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("monthly_billing")
      .update({ is_paid })
      .in("id", ids)
      .select();

    if (error) {
      console.error("Bulk billing update error:", error);
      return NextResponse.json({ error: "Failed to update billing records" }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedCount: data?.length ?? 0 });
  } catch (error) {
    console.error("Billing bulk POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
