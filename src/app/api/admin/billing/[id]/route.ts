import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { is_paid } = await request.json();

    if (typeof is_paid !== "boolean") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("monthly_billing")
      .update({ is_paid })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, billing: data });
  } catch (error) {
    console.error("Billing update error:", error);
    return NextResponse.json(
      { error: "Failed to update billing status" },
      { status: 500 }
    );
  }
}
