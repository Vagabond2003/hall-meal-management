import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Initial fetch for the dashboard — ALL queries run in parallel
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [
    { count: totalStudents },
    { count: pendingApprovalsCount },
    { count: activeMeals },
    { data: billingData },
    { data: pendingApprovalsList },
    { data: recentStudents },
    { data: recentMeals },
    { data: feedbackRaw },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "student").eq("is_approved", false),
    supabaseAdmin.from("meals").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("monthly_billing").select("total_cost").eq("month", currentMonth).eq("year", currentYear),
    supabaseAdmin.from("users").select("id, name, email, token_number, created_at").eq("role", "student").eq("is_approved", false).order("created_at", { ascending: false }).limit(5),
    supabaseAdmin.from("users").select("id, name, created_at").eq("role", "student").order("created_at", { ascending: false }).limit(5),
    supabaseAdmin.from("meals").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabaseAdmin.from('meal_feedback').select('id, rating, comment, created_at, student_id, weekly_menu_id, date').order('created_at', { ascending: false }).limit(5),
  ]);

  const thisMonthRevenue = billingData?.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0) || 0;

  const metrics = {
    totalStudents: totalStudents || 0,
    pendingApprovals: pendingApprovalsCount || 0,
    activeMeals: activeMeals || 0,
    thisMonthRevenue
  };

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

  // Enrich feedback with user & menu info (parallel if data exists)
  let initialFeedback: {
    id: string;
    student_name: string;
    token_number: string;
    meal_slot: string;
    date: string;
    rating: number;
    comment: string | null;
    created_at: string;
    weekly_menu_id: string;
  }[] = [];

  if (feedbackRaw && feedbackRaw.length > 0) {
    const fbStudentIds = [...new Set(feedbackRaw.map(f => f.student_id))];
    const fbMenuIds = [...new Set(feedbackRaw.map(f => f.weekly_menu_id))];

    const [{ data: fbUsers }, { data: fbMenus }] = await Promise.all([
      supabaseAdmin.from('users').select('id, name, token_number').in('id', fbStudentIds),
      supabaseAdmin.from('weekly_menus').select('id, meal_slot').in('id', fbMenuIds),
    ]);

    const userMap = Object.fromEntries((fbUsers ?? []).map(u => [u.id, u]));
    const menuMap = Object.fromEntries((fbMenus ?? []).map(m => [m.id, m]));

    initialFeedback = feedbackRaw.map(f => ({
      id: f.id,
      student_name: userMap[f.student_id]?.name ?? 'Unknown',
      token_number: userMap[f.student_id]?.token_number ?? '',
      meal_slot: menuMap[f.weekly_menu_id]?.meal_slot ?? 'Meal',
      date: f.date,
      rating: f.rating,
      comment: f.comment,
      created_at: f.created_at,
      weekly_menu_id: f.weekly_menu_id,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {pendingApprovalsCount !== null && pendingApprovalsCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border-l-4 border-[#C4873A] rounded-r-lg shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#C4873A]" />
            <p className="text-amber-900 font-medium">
              {pendingApprovalsCount} student(s) are waiting for approval
            </p>
          </div>
          <Link
            href="/admin/students"
            className="flex items-center gap-1 text-sm font-semibold text-[#C4873A] hover:text-amber-800 transition-colors"
          >
            Review now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      <AdminDashboardClient
        initialMetrics={metrics}
        initialPending={pendingApprovalsList || []}
        initialActivities={activities}
        initialFeedback={initialFeedback}
      />
    </div>
  );
}
