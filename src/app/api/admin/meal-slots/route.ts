import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: slots, error } = await supabaseAdmin
      .from("meal_slots")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/admin/meal-slots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
    }

    const upsertData = slots.map((s: any) => {
      const data: any = {
        name: s.name,
        display_order: s.display_order,
        is_active: s.is_active ?? true,
      };
      if (s.id) data.id = s.id;
      return data;
    });

    const { data: updatedSlots, error } = await supabaseAdmin
      .from("meal_slots")
      .upsert(upsertData, { onConflict: "id" })
      .select();

    if (error) throw error;
    return NextResponse.json({ slots: updatedSlots });
  } catch (error) {
    console.error("PUT /api/admin/meal-slots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
