import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'

    // If no settings row exists yet, return default empty object
    const res = NextResponse.json({ settings: data || null });
    res.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );
    return res;
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { meal_selection_deadline, admin_secret_code } = body;

    // We expect there to be exactly 1 settings row. Let's fetch it first to get its ID,
    // or if it doesn't exist, we insert it.
    const { data: existingSettings } = await supabaseAdmin
      .from("settings")
      .select("id")
      .limit(1)
      .single();

    const updatePayload: any = {};
    if (meal_selection_deadline !== undefined) updatePayload.meal_selection_deadline = meal_selection_deadline;
    if (admin_secret_code !== undefined) updatePayload.admin_secret_code = admin_secret_code;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let result;
    if (existingSettings) {
      const { data, error } = await supabaseAdmin
        .from("settings")
        .update(updatePayload)
        .eq("id", existingSettings.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("settings")
        .insert([updatePayload])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ message: "Settings updated successfully", settings: result });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
