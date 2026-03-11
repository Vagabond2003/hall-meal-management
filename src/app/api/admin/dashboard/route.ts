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

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Fetch Total Students
    const { count: totalStudents } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // Fetch Pending Approvals
    const { count: pendingApprovalsCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_approved", false);

    // Fetch Active Meals
    const { count: activeMeals } = await supabaseAdmin
      .from("meals")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch This Month Revenue
    const { data: billingData } = await supabaseAdmin
      .from("monthly_billing")
      .select("total_cost")
      .eq("month", currentMonth)
      .eq("year", currentYear);

    const thisMonthRevenue = billingData?.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0) || 0;

    // Fetch Pending Approvals List
    const { data: pendingApprovalsList } = await supabaseAdmin
      .from("users")
      .select("id, name, email, rna_number, created_at")
      .eq("role", "student")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch Recent Activity (simulated by combining recent students and meals)
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
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

    return NextResponse.json({
      metrics: {
        totalStudents: totalStudents || 0,
        pendingApprovals: pendingApprovalsCount || 0,
        activeMeals: activeMeals || 0,
        thisMonthRevenue
      },
      pendingApprovalsList: pendingApprovalsList || [],
      activities
    });
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
