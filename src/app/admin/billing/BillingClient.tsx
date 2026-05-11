"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle,
  XCircle,
  Banknote,
  AlertCircle,
  Search,
  Loader2,
  CreditCard,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type StatusFilter = "all" | "paid" | "unpaid";

interface BillingRecord {
  id: string;
  student_id: string;
  month: number;
  year: number;
  total_cost: number;
  is_paid: boolean;
  created_at: string;
  name: string;
  email: string;
  token_number: string;
}

export default function BillingClient() {
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"paid" | "unpaid" | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }, []);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/billing?month=${month}&year=${year}&status=${status}&q=${encodeURIComponent(searchTerm)}`
      );
      if (!res.ok) throw new Error("Failed to fetch billing");
      const data = await res.json();
      setBilling(data.billing ?? []);
    } catch (error) {
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  }, [month, year, status, searchTerm]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // BUG FIX #2: Clear selection when month/year changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [month, year, status]);

  const stats = useMemo(() => {
    const totalStudents = billing.length;
    const paidCount = billing.filter((b) => b.is_paid).length;
    const unpaidCount = totalStudents - paidCount;
    const totalCollected = billing
      .filter((b) => b.is_paid)
      .reduce((acc, b) => acc + Number(b.total_cost), 0);
    const totalPending = billing
      .filter((b) => !b.is_paid)
      .reduce((acc, b) => acc + Number(b.total_cost), 0);
    return { totalStudents, paidCount, unpaidCount, totalCollected, totalPending };
  }, [billing]);

  const handleTogglePaid = async (record: BillingRecord) => {
    try {
      setUpdatingId(record.id);
      const newStatus = !record.is_paid;

      // Optimistic update
      setBilling((prev) =>
        prev.map((b) => (b.id === record.id ? { ...b, is_paid: newStatus } : b))
      );

      const res = await fetch(`/api/admin/billing/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paid: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      toast.success(
        `Marked ${record.name} as ${newStatus ? "paid" : "unpaid"}`
      );
    } catch (error: any) {
      // Revert on error
      setBilling((prev) =>
        prev.map((b) => (b.id === record.id ? { ...b, is_paid: record.is_paid } : b))
      );
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(billing.map((b) => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const openBulkDialog = (action: "paid" | "unpaid") => {
    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    try {
      setBulkLoading(true);
      const res = await fetch("/api/admin/billing/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          is_paid: bulkAction === "paid",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Bulk update failed");
      }

      toast.success(`Marked ${selectedIds.size} student(s) as ${bulkAction}`);
      setSelectedIds(new Set());
      // BUG FIX #4: refetch after bulk action
      await fetchBilling();
    } catch (error: any) {
      toast.error(error.message || "Bulk update failed");
    } finally {
      setBulkLoading(false);
      setBulkDialogOpen(false);
      setBulkAction(null);
    }
  };

  const handleExportUnpaid = () => {
    try {
      setExportLoading(true);
      const unpaid = billing.filter((b) => !b.is_paid);
      if (unpaid.length === 0) {
        toast.error("No unpaid students to export.");
        setExportLoading(false);
        return;
      }

      const rows = [
        ["Token Number", "Name", "Email", "Total Bill (৳)", "Month", "Year"],
        ...unpaid.map((b) => [
          b.token_number,
          b.name,
          b.email,
          Number(b.total_cost).toFixed(2),
          MONTH_NAMES[b.month - 1],
          b.year,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Unpaid Students");
      const monthStr = String(month).padStart(2, "0");
      XLSX.writeFile(wb, `unpaid-students-${monthStr}-${year}.xlsx`);
      toast.success(`Exported ${unpaid.length} unpaid students`);
    } catch {
      toast.error("Failed to export Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const allSelected = billing.length > 0 && selectedIds.size === billing.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < billing.length;

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">
          Billing Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Track monthly meal payments and mark students as paid.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-5 h-5 text-primary" />}
          delay={0}
        />
        <StatCard
          label="Paid"
          value={stats.paidCount}
          icon={<CheckCircle className="w-5 h-5 text-success" />}
          iconBg="bg-success/10"
          delay={100}
          valueColor="text-success"
        />
        <StatCard
          label="Unpaid"
          value={stats.unpaidCount}
          icon={<XCircle className="w-5 h-5 text-danger" />}
          iconBg="bg-danger/10"
          delay={200}
          valueColor="text-danger"
        />
        <StatCard
          label="Total Collected"
          value={stats.totalCollected}
          prefix="৳"
          icon={<Banknote className="w-5 h-5 text-success" />}
          iconBg="bg-success/10"
          delay={300}
          valueColor="text-success"
          isText
        />
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" as const }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Select */}
          <Select
            value={month.toString()}
            onValueChange={(v) => v && setMonth(parseInt(v, 10))}
          >
            <SelectTrigger className="w-[140px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Select */}
          <Select
            value={year.toString()}
            onValueChange={(v) => v && setYear(parseInt(v, 10))}
          >
            <SelectTrigger className="w-[100px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Tabs */}
          <div className="flex bg-white dark:bg-[#182218] p-1 rounded-xl shadow-sm border border-slate-100 dark:border-[#2A3A2B] overflow-x-auto">
            {(["all", "paid", "unpaid"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  status === s
                    ? "bg-primary text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white dark:bg-[#182218] dark:border-[#2A3A2B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
              placeholder="Search by name or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export */}
          <button
            onClick={handleExportUnpaid}
            disabled={exportLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#2A3A2B] dark:text-slate-300 dark:hover:bg-[#1F2B20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Unpaid
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-white dark:bg-[#182218] shadow-sm rounded-2xl border border-slate-100 dark:border-[#2A3A2B] overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
      >
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#2A3A2B]">
            <thead className="bg-[#F0EFE9] dark:bg-[#1F2B20]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300"
                >
                  Token
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300"
                >
                  Total Bill
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-[#182218] dark:divide-[#2A3A2B]">
              <AnimatePresence mode="wait">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={`skeleton-${i}`}
                      className="border-b border-slate-100 dark:border-[#2A3A2B]"
                    >
                      <td colSpan={6} className="px-6 py-4">
                        <LoadingSkeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))
                ) : billing.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <EmptyState
                        icon={<CreditCard className="w-12 h-12 opacity-20" />}
                        title="No billing records"
                        description={`No students have billing data for ${MONTH_NAMES[month - 1]} ${year}. Only students with generated bills appear here.`}
                      />
                    </td>
                  </tr>
                ) : (
                  billing.map((record, i) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-[#2A3A2B] dark:hover:bg-[#1F2B20]"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selectedIds.has(record.id)}
                          onChange={(e) =>
                            handleSelectRow(record.id, e.target.checked)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {record.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {record.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                          #{record.token_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ৳{Number(record.total_cost).toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.is_paid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> UNPAID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleTogglePaid(record)}
                          disabled={updatingId === record.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            record.is_paid
                              ? "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#2A3A2B] dark:text-slate-300 dark:hover:bg-[#1F2B20]"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          }`}
                        >
                          {updatingId === record.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : record.is_paid ? (
                            <>
                              <ArrowUpDown className="w-3.5 h-3.5" /> Mark Unpaid
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                            </>
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 bg-white dark:bg-[#182218] border border-slate-200 dark:border-[#2A3A2B] rounded-2xl shadow-elevated"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2A3A2B]" />
            <button
              onClick={() => openBulkDialog("paid")}
              className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              Mark as Paid
            </button>
            <button
              onClick={() => openBulkDialog("unpaid")}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Mark as Unpaid
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-[#2A3A2B]" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Confirm Dialog */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={(open) => !open && setBulkDialogOpen(false)}>
        <AlertDialogContent className="bg-white dark:bg-[#182218] border-slate-100 dark:border-[#2A3A2B] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl text-slate-900 dark:text-white">
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-slate-500 dark:text-slate-400">
              Are you sure you want to mark{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {selectedIds.size}
              </span>{" "}
              student{selectedIds.size !== 1 ? "s" : ""} as{" "}
              {bulkAction ?? ""}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setBulkDialogOpen(false)}
              className="bg-slate-100 text-slate-900 dark:bg-[#2A3A2B] dark:text-white border-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-6 h-11"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkConfirm();
              }}
              disabled={bulkLoading}
              className="bg-primary text-white hover:bg-primary-light border-0 rounded-xl px-6 h-11 flex items-center justify-center gap-2"
            >
              {bulkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Mark as ${bulkAction ?? ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
