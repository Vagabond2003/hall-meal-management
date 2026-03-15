"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserCheck, 
  Utensils, 
  Banknote,
  CheckCircle,
  XCircle,
  UserPlus,
  Star,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { StatCard } from "@/components/shared/StatCard";
import Link from "next/link";
import { FileText, Table, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { MonthlyBillSummary } from "@/components/pdf/MonthlyBillSummary";
import { generateExcelExport } from "@/lib/exportBillingSummary";


interface MetricData {
  totalStudents: number;
  pendingApprovals: number;
  activeMeals: number;
  thisMonthRevenue: number;
}

interface PendingStudent {
  id: string;
  name: string;
  email: string;
  token_number: string;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface AdminDashboardClientProps {
  initialMetrics: MetricData;
  initialPending: PendingStudent[];
  initialActivities: Activity[];
  initialFeedback: {
    id: string;
    student_name: string;
    token_number: string;
    meal_slot: string;
    date: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }[];
}

export default function AdminDashboardClient({
  initialMetrics,
  initialPending,
  initialActivities,
  initialFeedback
}: AdminDashboardClientProps) {
  const [metrics, setMetrics] = useState<MetricData>(initialMetrics);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>(initialPending);
  const [recentFeedback] = useState(initialFeedback);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const currentMonthStr = new Date().toLocaleString("en-US", { month: "long", timeZone: "Asia/Dhaka" });
  const currentYearStr = new Date().toLocaleString("en-US", { year: "numeric", timeZone: "Asia/Dhaka" });
  const displayMonthYear = `${currentMonthStr} ${currentYearStr}`;

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error("Failed to update student status");

      toast.success(action === 'approve' ? "Student approved successfully" : "Student application rejected");

      // Optimistic upate
      setPendingStudents(prev => prev.filter(s => s.id !== id));
      if (action === 'approve') {
        setMetrics(m => ({ ...m, pendingApprovals: Math.max(0, m.pendingApprovals - 1), totalStudents: m.totalStudents }));
      } else {
        setMetrics(m => ({ ...m, pendingApprovals: Math.max(0, m.pendingApprovals - 1), totalStudents: Math.max(0, m.totalStudents - 1) }));
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchBillingData = async () => {
    const res = await fetch(`/api/admin/billing-summary?t=${Date.now()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch billing data");
    }
    const data = await res.json();
    return data.summary || [];
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const data = await fetchBillingData();
      
      const blob = await pdf(<MonthlyBillSummary data={data} monthStr={displayMonthYear} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HallMealHub_${currentMonthStr}_${currentYearStr}_BillSummary.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
      
      toast.success("PDF exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const data = await fetchBillingData();
      generateExcelExport(data, displayMonthYear);
      toast.success("Excel exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (

    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <div>
          <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of hall activity and pending tasks.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || isExportingExcel}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium rounded-xl border border-amber-600 text-amber-600 hover:bg-amber-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-amber-500 dark:text-amber-500 w-full sm:w-auto"
          >
            {isExportingPDF ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <FileText className="w-5 h-5 sm:w-4 sm:h-4" />}
            Export {currentMonthStr} PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel || isExportingPDF}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isExportingExcel ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Table className="w-5 h-5 sm:w-4 sm:h-4" />}
            Export {currentMonthStr} Excel
          </button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/students" className="block outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <StatCard
            label="Total Students"
            value={metrics.totalStudents}
            icon={<Users className="w-5 h-5 text-primary" />}
            delay={0.1}
          />
        </Link>
        <Link href="/admin/students?filter=pending" className="block outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <StatCard
            label="Pending Approvals"
            value={metrics.pendingApprovals}
            icon={<UserCheck className={metrics.pendingApprovals > 0 ? "w-5 h-5 text-amber-600 dark:text-amber-500" : "w-5 h-5 text-primary"} />}
            delay={0.2}
            valueColor={metrics.pendingApprovals > 0 ? "text-amber-600 dark:text-amber-500" : undefined}
            iconBg={metrics.pendingApprovals > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}
          />
        </Link>
        <Link href="/admin/meals" className="block outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <StatCard
            label="Active Meals"
            value={metrics.activeMeals}
            icon={<Utensils className="w-5 h-5 text-primary" />}
            delay={0.3}
          />
        </Link>
        <Link href="/admin/students" className="block outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <StatCard
            label="This Month Revenue"
            value={metrics.thisMonthRevenue}
            prefix="৳"
            icon={<Banknote className="w-5 h-5 text-primary" />}
            delay={0.4}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Pending Approvals Widget */}
        <motion.div 
          className="col-span-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-slate-800 dark:text-slate-100">
              Pending Approvals
            </h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {pendingStudents.length} Action{pendingStudents.length !== 1 ? 's' : ''} Needed
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {pendingStudents.length > 0 ? (
                pendingStudents.map((student, i) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.08 * i }}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-[#2A3A2B] dark:hover:bg-[#1F2B20] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{student.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span>{student.email}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="font-mono text-xs">{student.token_number}</span>
                      </div>
                    </div>
                    <div className="flex w-full sm:w-auto sm:items-center gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleApprove(student.id, 'reject')}
                        className="flex-1 sm:flex-none flex items-center justify-center rounded-lg border border-red-200 bg-white p-3 sm:p-2 text-red-600 transition-all hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20 min-h-[44px] sm:min-h-0"
                        title="Reject"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleApprove(student.id, 'approve')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 sm:py-2 px-4 text-sm font-medium text-white transition-all hover:bg-green-700 hover:shadow-md dark:bg-green-700 dark:hover:bg-green-600 min-h-[44px] sm:min-h-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">All caught up!</h3>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">No students are currently pending approval.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div 
          className="col-span-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6, ease: "easeOut" as const }}
        >
          <h2 className="mb-6 text-xl font-heading font-semibold text-slate-800 dark:text-slate-100">
            Recent Activity
          </h2>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-[#2A3A2B]">
            {initialActivities.length > 0 ? (
              initialActivities.map((activity, i) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (i * 0.05) }}
                  className="relative flex items-start justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 z-10 dark:bg-[#1F2B20] dark:border-[#2A3A2B]">
                      {activity.type === 'student_joined' ? (
                        <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Utensils className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {activity.type === 'student_joined' ? 'New Student' : 'Meal Added'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-400 dark:text-slate-500 mt-1 whitespace-nowrap">
                    {format(new Date(activity.created_at), "MMM d")}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                No recent activity.
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Feedback Widget */}
        <motion.div
          className="col-span-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.7, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-slate-800 dark:text-slate-100">
              Recent Feedback
            </h2>
            <MessageSquare className="w-5 h-5 text-amber-500" />
          </div>

          {recentFeedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No feedback yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentFeedback.slice(0, 5).map((f) => (
                <div key={f.id} className="flex flex-col gap-1 pb-4 border-b border-slate-100 dark:border-[#2A3A2B] last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{f.student_name}</span>
                    <span className="text-xs font-mono text-slate-400 shrink-0">#{f.token_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{f.meal_slot}</span>
                    <span className="text-amber-500 text-xs">
                      {Array(f.rating).fill('★').join('')}
                      {Array(5 - f.rating).fill('☆').join('')}
                    </span>
                  </div>
                  {f.comment && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                      &ldquo;{f.comment}&rdquo;
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {format(new Date(f.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
