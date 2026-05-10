"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileDown,
  Search,
  ChevronRight,
  RotateCcw,
  Sun,
  Sunrise,
  Moon,
  CalendarDays,
  Users,
  UtensilsCrossed,
  Check,
  Minus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import MealPDFGeneratorModal from "@/components/admin/MealPDFGeneratorModal";

interface MealDate {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface Student {
  id: string;
  name: string;
  token_number: string;
  rna_number: string;
  room_no: string;
  meal_selection_enabled: boolean;
  status: "Active" | "Paused";
  total_meals: number;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  meal_dates: MealDate[];
}

interface MealSubscribersData {
  students: Student[];
  totalStudentsWithMeals: number;
  totalMealsCount: number;
  mealBreakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;
  };
  month: number;
  year: number;
}

interface MealSubscribersTableProps {
  initialData: MealSubscribersData;
  month: number;
  year: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type MealFilter = "All" | "Breakfast" | "Lunch" | "Dinner";
type SortKey = "name" | "meals" | "latest";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MealSubscribersTable({
  initialData,
  month,
  year,
}: MealSubscribersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  const students = initialData.students ?? [];
  const mealBreakdown = initialData.mealBreakdown ?? { breakfast: 0, lunch: 0, dinner: 0, total: 0 };

  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
  }));
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const filtered = useMemo(() => {
    let result = [...students];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.token_number.toLowerCase().includes(q) ||
          s.rna_number.toLowerCase().includes(q)
      );
    }

    if (mealFilter === "Breakfast") {
      result = result.filter((s) => s.has_breakfast);
    } else if (mealFilter === "Lunch") {
      result = result.filter((s) => s.has_lunch);
    } else if (mealFilter === "Dinner") {
      result = result.filter((s) => s.has_dinner);
    }

    if (sortKey === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "meals") {
      result.sort((a, b) => b.total_meals - a.total_meals);
    } else if (sortKey === "latest") {
      result.sort((a, b) => {
        const aLatest = a.meal_dates[a.meal_dates.length - 1]?.date ?? "";
        const bLatest = b.meal_dates[b.meal_dates.length - 1]?.date ?? "";
        return bLatest.localeCompare(aLatest);
      });
    }

    return result;
  }, [students, searchQuery, mealFilter, sortKey]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const monthLabel = monthNames[month - 1];
  const totalBreakfasts = mealBreakdown.breakfast;
  const totalLunches = mealBreakdown.lunch;
  const totalDinners = mealBreakdown.dinner;
  const totalMeals = mealBreakdown.total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/analytics?month=${month}&year=${year}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-border/50 rounded-xl hover:bg-surface-secondary transition-colors"
            title="Refresh data"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsPDFModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Generate PDF Report
          </button>
        </div>
      </div>

      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Meal Subscribers</h1>
          <p className="mt-1 text-text-secondary text-sm font-sans">
            {monthLabel} {year}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => {
              const newMonth = Number(e.target.value);
              router.push(`/admin/analytics/meal-subscribers?month=${newMonth}&year=${year}`);
            }}
            className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary shadow-sm font-sans"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => {
              const newYear = Number(e.target.value);
              router.push(`/admin/analytics/meal-subscribers?month=${month}&year=${newYear}`);
            }}
            className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary shadow-sm font-sans"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Total Meals</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{totalMeals}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Students</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{initialData.totalStudentsWithMeals}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Period</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{monthLabel} {year}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Sunrise className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Breakfasts</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{totalBreakfasts}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Sun className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Lunches</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{totalLunches}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Dinners</span>
          </div>
          <p className="text-2xl font-heading font-bold text-text-primary">{totalDinners}</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name / token / RNA..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border/50 rounded-xl text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={mealFilter}
          onChange={(e) => setMealFilter(e.target.value as MealFilter)}
          className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary shadow-sm"
        >
          <option value="All">All Meals</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary shadow-sm"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="meals">Sort: Most Meals</option>
          <option value="latest">Sort: Latest Activity</option>
        </select>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Users className="w-10 h-10 opacity-20" />}
              title={`No meal selections found for ${monthLabel} ${year}`}
              description="Try adjusting your filters or selecting a different month."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary/50 sticky top-0 z-10">
                <tr>
                  <th className="text-left font-medium text-text-secondary px-4 py-3 w-10">#</th>
                  <th className="text-left font-medium text-text-secondary px-4 py-3">Student</th>
                  <th className="text-left font-medium text-text-secondary px-4 py-3">Token</th>
                  <th className="text-left font-medium text-text-secondary px-4 py-3">RNA No.</th>
                  <th className="text-center font-medium text-text-secondary px-4 py-3">Breakfast</th>
                  <th className="text-center font-medium text-text-secondary px-4 py-3">Lunch</th>
                  <th className="text-center font-medium text-text-secondary px-4 py-3">Dinner</th>
                  <th className="text-center font-medium text-text-secondary px-4 py-3">Total</th>
                  <th className="text-left font-medium text-text-secondary px-4 py-3">Status</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((student, index) => {
                  const isExpanded = expandedIds.has(student.id);
                  return (
                    <Fragment key={student.id}>
                      <tr
                        onClick={() => toggleExpanded(student.id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-text-secondary">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                getAvatarColor(student.name)
                              )}
                            >
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{student.name}</p>
                              <p className="text-xs text-text-secondary">Room {student.room_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{student.token_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{student.rna_number}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.has_breakfast ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              <Sunrise className="w-3 h-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-disabled">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.has_lunch ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                              <Sun className="w-3 h-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-disabled">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.has_dinner ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                              <Moon className="w-3 h-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-disabled">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-text-primary">{student.total_meals}</td>
                        <td className="px-4 py-3">
                          {student.status === "Active" ? (
                            <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium border border-amber-400 text-amber-700 px-2.5 py-1 rounded-full">
                              Paused
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 text-text-secondary transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="px-0 py-0">
                            <div className="bg-gray-50/60 border-l-4 border-primary/30 pl-8 pr-4 py-4">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-text-secondary">
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 font-medium text-center">Breakfast</th>
                                    <th className="pb-2 font-medium text-center">Lunch</th>
                                    <th className="pb-2 font-medium text-center">Dinner</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                  {student.meal_dates.map((md) => (
                                    <tr key={md.date}>
                                      <td className="py-2 text-text-primary">{formatDate(md.date)}</td>
                                      <td className="py-2 text-center">
                                        {md.breakfast ? (
                                          <Check className="w-4 h-4 text-amber-600 mx-auto" />
                                        ) : (
                                          <Minus className="w-3 h-3 text-text-disabled mx-auto" />
                                        )}
                                      </td>
                                      <td className="py-2 text-center">
                                        {md.lunch ? (
                                          <Check className="w-4 h-4 text-sky-600 mx-auto" />
                                        ) : (
                                          <Minus className="w-3 h-3 text-text-disabled mx-auto" />
                                        )}
                                      </td>
                                      <td className="py-2 text-center">
                                        {md.dinner ? (
                                          <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                                        ) : (
                                          <Minus className="w-3 h-3 text-text-disabled mx-auto" />
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-surface-secondary/50 sticky bottom-0 z-10 border-t border-border/50">
                <tr>
                  <td className="px-4 py-3 font-semibold text-text-primary" colSpan={4}>TOTAL</td>
                  <td className="px-4 py-3 text-center font-semibold text-text-primary">{totalBreakfasts}</td>
                  <td className="px-4 py-3 text-center font-semibold text-text-primary">{totalLunches}</td>
                  <td className="px-4 py-3 text-center font-semibold text-text-primary">{totalDinners}</td>
                  <td className="px-4 py-3 text-center font-semibold text-text-primary">{totalMeals}</td>
                  <td className="px-4 py-3" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Users className="w-10 h-10 opacity-20" />}
              title={`No meal selections found for ${monthLabel} ${year}`}
              description="Try adjusting your filters or selecting a different month."
            />
          </div>
        ) : (
          filtered.map((student) => {
            const isExpanded = expandedIds.has(student.id);
            return (
              <div
                key={student.id}
                className="bg-surface rounded-2xl border border-border/50 p-4 shadow-sm"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleExpanded(student.id)}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      getAvatarColor(student.name)
                    )}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{student.name}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{student.token_number}</span>
                      <span>RNA: {student.rna_number}</span>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-text-secondary transition-transform shrink-0",
                      isExpanded && "rotate-90"
                    )}
                  />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {student.has_breakfast && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      <Sunrise className="w-3 h-3" />
                      Breakfast
                    </span>
                  )}
                  {student.has_lunch && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-sky-100 text-sky-800 px-2 py-1 rounded-full">
                      <Sun className="w-3 h-3" />
                      Lunch
                    </span>
                  )}
                  {student.has_dinner && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      <Moon className="w-3 h-3" />
                      Dinner
                    </span>
                  )}
                  <span className="ml-auto text-sm font-semibold text-text-primary">{student.total_meals} meals</span>
                </div>

                {student.status === "Active" ? (
                  <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full mt-2">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium border border-amber-400 text-amber-700 px-2 py-1 rounded-full mt-2">
                    Paused
                  </span>
                )}

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                    {student.meal_dates.map((md) => (
                      <div key={md.date} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{formatDate(md.date)}</span>
                        <div className="flex items-center gap-3">
                          {md.breakfast ? <Sunrise className="w-4 h-4 text-amber-600" /> : <Minus className="w-3 h-3 text-text-disabled" />}
                          {md.lunch ? <Sun className="w-4 h-4 text-sky-600" /> : <Minus className="w-3 h-3 text-text-disabled" />}
                          {md.dinner ? <Moon className="w-4 h-4 text-indigo-600" /> : <Minus className="w-3 h-3 text-text-disabled" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <MealPDFGeneratorModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
      />
    </motion.div>
  );
}
