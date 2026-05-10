"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  Search,
  ArrowUpDown,
  Download,
  Users,
  UtensilsCrossed,
  AlertCircle,
  RotateCcw,
  User,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export interface MealSubscriber {
  id: string;
  name: string;
  token_number: string;
  rna_number: string;
  room_no: string;
  meals_this_month: number;
  status: "active" | "paused" | "inactive";
  is_active: boolean;
  meal_selection_enabled: boolean;
}

interface MealSubscribersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

type SortKey = "name" | "meals" | "room";
type SortDir = "asc" | "desc";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function exportToCSV(students: MealSubscriber[], month: number, year: number) {
  const monthStr = monthNames[month - 1];
  const headers = ["Name", "Token Number", "RNA Number", "Room No", "Meals This Month", "Status"];
  const rows = students.map((s) => [
    s.name ?? "N/A",
    s.token_number ?? "N/A",
    s.rna_number ?? "N/A",
    s.room_no ?? "N/A",
    String(s.meals_this_month ?? 0),
    s.status ?? "N/A",
  ]);
  const csvContent = [headers, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meal-subscribers-${monthStr}-${year}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function MealSubscribersDrawer({ isOpen, onClose, month, year }: MealSubscribersDrawerProps) {
  const [students, setStudents] = useState<MealSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<{ month: number; year: number } | null>(null);

  const fetchData = async (m: number, y: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/meal-subscribers?month=${m}&year=${y}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch");
      }
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when drawer opens or month/year changes
  useEffect(() => {
    if (!isOpen) return;

    const shouldFetch =
      !lastFetchedRef.current ||
      lastFetchedRef.current.month !== month ||
      lastFetchedRef.current.year !== year;

    if (shouldFetch) {
      lastFetchedRef.current = { month, year };
      fetchData(month, year);
    }
  }, [isOpen, month, year]);

  // Reset search on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.rna_number !== "N/A" && s.rna_number.toLowerCase().includes(q)) ||
        (s.token_number !== "N/A" && s.token_number.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "meals":
          return dir * (a.meals_this_month - b.meals_this_month);
        case "room":
          return dir * (a.room_no || "").localeCompare(b.room_no || "");
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const activeCount = students.filter((s) => s.status === "active").length;
  const pausedCount = students.filter((s) => s.status === "paused").length;
  const totalMeals = students.reduce((sum, s) => sum + s.meals_this_month, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="absolute right-0 top-0 h-full w-full md:w-[480px] bg-surface shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0">
              <div>
                <h2 id="drawer-title" className="text-lg font-heading font-bold text-text-primary">
                  Meal Subscribers
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {monthNames[month - 1]} {year}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-surface-secondary flex items-center justify-center transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4 shrink-0">
              <div className="bg-surface-secondary rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-muted flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-text-secondary">Active Students</span>
                </div>
                <p className="text-2xl font-heading font-bold text-text-primary">
                  {loading ? "—" : activeCount}
                </p>
                {pausedCount > 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">{pausedCount} paused</p>
                )}
              </div>
              <div className="bg-surface-secondary rounded-xl p-4 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-muted flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-text-secondary">Total Meals</span>
                </div>
                <p className="text-2xl font-heading font-bold text-text-primary">
                  {loading ? "—" : totalMeals.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or RNA number..."
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary border border-border/40 rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Sort bar */}
            <div className="px-6 pb-2 flex items-center gap-2 shrink-0">
              <span className="text-xs text-text-secondary mr-1">Sort by:</span>
              {[
                { key: "name" as SortKey, label: "Name" },
                { key: "meals" as SortKey, label: "Meals" },
                { key: "room" as SortKey, label: "Room" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1",
                    sortKey === s.key
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-secondary text-text-secondary border-border/40 hover:border-border"
                  )}
                >
                  {s.label}
                  {sortKey === s.key && (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
              {loading ? (
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <LoadingSkeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <LoadingSkeleton className="w-32 h-4 rounded-md" />
                        <LoadingSkeleton className="w-20 h-3 rounded-md" />
                      </div>
                      <LoadingSkeleton className="w-16 h-6 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-10 h-10 text-danger mb-3" />
                  <h3 className="text-base font-heading font-semibold text-text-primary mb-1">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-text-secondary mb-4 max-w-xs">{error}</p>
                  <button
                    onClick={() => fetchData(month, year)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : sorted.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<User className="w-10 h-10 opacity-20" />}
                    title="No students found"
                    description={
                      searchQuery
                        ? "No students match your search. Try a different query."
                        : "No students have meals active this month."
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {sorted.map((student, index) => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors",
                        index % 2 === 0 ? "bg-transparent" : "bg-gray-50/50 dark:bg-white/5"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          getAvatarColor(student.name)
                        )}
                      >
                        {getInitials(student.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                          <span className="font-mono">#{student.token_number}</span>
                          <span className="text-border">|</span>
                          <span>RNA: {student.rna_number}</span>
                          {student.room_no !== "N/A" && (
                            <>
                              <span className="text-border">|</span>
                              <span>Room: {student.room_no}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Meals count */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {student.meals_this_month}
                        </p>
                        <p className="text-[10px] text-text-secondary">meals</p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                          student.status === "active" && "bg-emerald-100 text-emerald-700",
                          student.status === "paused" && "bg-amber-100 text-amber-700",
                          student.status === "inactive" && "bg-slate-100 text-slate-600"
                        )}
                      >
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border/50 bg-surface-secondary/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-text-secondary">
                  Showing {sorted.length} of {students.length} students
                </p>
              </div>
              <button
                onClick={() => exportToCSV(sorted, month, year)}
                disabled={loading || sorted.length === 0}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  loading || sorted.length === 0
                    ? "bg-surface-secondary text-text-disabled cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
