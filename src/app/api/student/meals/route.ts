import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/student/meals — fetch all active meals + settings deadline
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [mealsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("meals").select("*").eq("is_active", true).order("created_at"),
    supabaseAdmin.from("settings").select("meal_selection_deadline, admin_secret_code").limit(1).single(),
  ]);

  if (mealsRes.error) {
    return NextResponse.json({ error: mealsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    meals: mealsRes.data ?? [],
    deadline: settingsRes.data?.meal_selection_deadline ?? "22:00:00",
  });
}
