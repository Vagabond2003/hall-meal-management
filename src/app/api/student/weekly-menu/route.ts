import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart");

  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("weekly_menus")
    .select("*")
    .eq("week_start_date", weekStart)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("GET /api/student/weekly-menu error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ menus: data ?? [] }, { headers: { "Cache-Control": "no-store, max-age=0, private" } });
}
