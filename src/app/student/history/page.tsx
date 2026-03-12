"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, UtensilsCrossed, Star } from "lucide-react";
import { toast } from "sonner";

interface Selection {
  id: string;
  date: string;
  price?: number;
  meals: { name: string; description: string | null; price: number; meal_type: string } | null;
  weekly_menus: { meal_slot: string; items: string | null; price: number } | null;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function MealHistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/selections?month=${month}&year=${year}`);
        const data = await res.json();
        setSelections(data.selections ?? []);
      } catch {
        toast.error("Failed to load meal history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [month, year]);

  const monthlyTotal = selections.reduce((acc, s) => {
    const special = Array.isArray(s.meals) ? s.meals[0] : s.meals;
    const regular = Array.isArray(s.weekly_menus) ? s.weekly_menus[0] : s.weekly_menus;
    return acc + Number(s.price ?? regular?.price ?? special?.price ?? 0);
  }, 0);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Meal History</h1>
        <p className="mt-1 text-text-secondary text-sm">View your past meal selections by month.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-sm text-text-secondary">
          {selections.length} record{selections.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : selections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
          <UtensilsCrossed className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">No meals recorded for {MONTHS[month - 1]} {year}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-surface-secondary text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
            <span>Date</span>
            <span>Meal</span>
            <span className="hidden sm:block">Items</span>
            <span className="text-right">Cost</span>
          </div>
          {/* Table Rows */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {selections.map((s, i) => {
              const special = Array.isArray(s.meals) ? s.meals[0] : s.meals;
              const regular = Array.isArray(s.weekly_menus) ? s.weekly_menus[0] : s.weekly_menus;
              const displayName = regular?.meal_slot ?? special?.name ?? "—";
              const isSpecial = Boolean(special?.meal_type === "special");
              return (
                <motion.div
                  key={s.id}
                  variants={rowVariants}
                  className={`grid grid-cols-4 gap-4 px-6 py-4 border-b border-border/40 last:border-0 items-center text-sm transition-colors hover:bg-primary-muted/30 ${i % 2 === 1 ? "bg-surface-secondary/30" : ""}`}
                >
                  <span className="text-text-secondary font-medium">
                    {format(new Date(s.date), "MMM d")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSpecial && <Star className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />}
                    <span className="font-medium text-text-primary truncate">{displayName}</span>
                  </div>
                  <span className="text-right font-semibold text-text-primary">
                    ৳{Number(s.price ?? regular?.price ?? special?.price ?? 0).toFixed(0)}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Monthly Total */}
      {!loading && selections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary rounded-2xl p-6 text-white shadow-sm"
        >
          <p className="text-white/70 text-sm mb-1">Total Cost — {MONTHS[month - 1]} {year}</p>
          <p className="text-4xl font-heading font-bold">৳{monthlyTotal.toFixed(2)}</p>
          <p className="text-white/50 text-xs mt-1">{selections.length} meals consumed</p>
        </motion.div>
      )}
    </motion.div>
  );
}
