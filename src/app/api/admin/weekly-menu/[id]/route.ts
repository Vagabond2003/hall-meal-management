import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, price, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from("weekly_menus")
      .update({ items, price, is_active: is_active ?? true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ menu: data });
  } catch (error) {
    console.error("PATCH /api/admin/weekly-menu/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("weekly_menus")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/weekly-menu failed:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
