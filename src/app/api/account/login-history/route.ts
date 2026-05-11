import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("login_activity")
      .select("success, ip, user_agent, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error("Fetch login history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch login history" },
      { status: 500 }
    );
  }
}
