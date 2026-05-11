import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ name: trimmedName })
      .eq("id", session.user.id)
      .select("name")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, name: data.name });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
