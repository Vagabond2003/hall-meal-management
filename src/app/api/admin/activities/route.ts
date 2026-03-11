import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: recentStudents } = await supabaseAdmin
      .from("users")
      .select("id, name, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentMeals } = await supabaseAdmin
      .from("meals")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const activities = [
      ...(recentStudents || []).map(s => ({
        id: `s-${s.id}`,
        type: "student_joined",
        description: `Student ${s.name} registered`,
        created_at: s.created_at
      })),
      ...(recentMeals || []).map(m => ({
        id: `m-${m.id}`,
        type: "meal_added",
        description: `Meal "${m.name}" was added`,
        created_at: m.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
