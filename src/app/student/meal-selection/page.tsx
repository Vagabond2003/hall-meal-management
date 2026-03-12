"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MealToggleCard } from "@/components/shared/MealToggleCard";
import {
  UtensilsCrossed,
  Sunrise,
  Sun,
  Moon,
  Clock,
  Lock,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_type: string;
  date: string | null;
  hasMenu?: boolean;
}

const getMealIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("breakfast") || lower.includes("morning")) return <Sunrise className="w-5 h-5" />;
  if (lower.includes("lunch") || lower.includes("afternoon")) return <Sun className="w-5 h-5" />;
  if (lower.includes("dinner") || lower.includes("evening") || lower.includes("night")) return <Moon className="w-5 h-5" />;
  return <UtensilsCrossed className="w-5 h-5" />;
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function MealSelectionPage() {
  const [regularMeals, setRegularMeals] = useState<Meal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deadline, setDeadline] = useState("10:00 PM");
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [mealSelectionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState("");

  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayObj = new Date();
        const dateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
        setTodayStr(dateStr);

        // Fetch daily menu (from weekly_menus) and selections in parallel.
        // NOTE: /api/student/meals (old meals table) is intentionally NOT used here.
        const [menuRes, selRes, settingsRes] = await Promise.all([
          fetch(`/api/student/daily-menu?date=${dateStr}`),
          fetch(`/api/student/selections?date=${dateStr}`),
          fetch(`/api/student/settings`),
        ]);

        // Process daily menu (regular meals from weekly_menus)
        if (menuRes.ok) {
          const { menus } = await menuRes.json();
          if (menus && menus.length > 0) {
            const menuMeals: Meal[] = menus.map((m: { id: string; meal_slot: string; items: string; price: string | number }) => ({
              id: m.id,
              name: m.meal_slot,
              description: m.items,
              price: Number(m.price),
              meal_type: "regular",
              date: null,
              hasMenu: true,
            }));
            setRegularMeals(menuMeals);
          } else {
            setRegularMeals([]);
          }
        }

        // Process selections
        if (selRes.ok) {
          const selData = await selRes.json();
          const selected = new Set<string>(
            (selData.selections ?? []).map((s: { meal_id: string | null; weekly_menu_id?: string | null }) =>
              s.weekly_menu_id ?? s.meal_id
            ).filter(Boolean) as string[]
          );
          setSelectedIds(selected);
        }

        // Get deadline from settings (not from old meals API)
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const dl: string = settingsData.deadline ?? "22:00:00";
          const [dh, dm] = dl.split(":").map(Number);
          const displayDl = `${dh > 12 ? dh - 12 : dh}:${String(dm).padStart(2, "0")} ${dh >= 12 ? "PM" : "AM"}`;
          setDeadline(displayDl);

          const dlTime = new Date();
          dlTime.setHours(dh, dm, 0, 0);
          setIsPastDeadline(todayObj > dlTime);
        }
      } catch {
        toast.error("Failed to load meal data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = (mealId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(mealId);
      else next.delete(mealId);
      return next;
    });
  };

  const estimatedCost = [...selectedIds].reduce((acc, id) => {
    const meal = regularMeals.find((m) => m.id === id);
    return acc + (meal ? Number(meal.price) : 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-secondary rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Meal Selection</h1>
          <p className="mt-1 text-text-secondary text-sm">
            {currentMonth} — Toggle meals to select or deselect them for today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-xl px-4 py-2 text-sm text-text-secondary shadow-sm">
          <Clock className="w-4 h-4" />
          <span>Daily cutoff: <strong className="text-text-primary">{deadline}</strong></span>
        </div>
      </div>

      {/* Banners */}
      {!mealSelectionEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-danger/8 border border-danger/20 rounded-xl text-danger"
        >
          <Lock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Your meal selection has been disabled due to an outstanding bill. Contact the admin.
          </p>
        </motion.div>
      )}

      {isPastDeadline && mealSelectionEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-warning/8 border border-warning/20 rounded-xl text-warning"
        >
          <Clock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Today&apos;s selection deadline has passed ({deadline}). Selections are now locked for today.
          </p>
        </motion.div>
      )}

      {/* Regular Meals */}
      <div>
        <h2 className="text-base font-heading font-semibold text-text-primary mb-3">Today&apos;s Menu</h2>
        
        {regularMeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-500"
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              No menu has been set for today. Check back later.
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
            {regularMeals.map((meal) => (
              <motion.div key={meal.id} variants={itemVariants}>
                <MealToggleCard
                  mealId={meal.id}
                  name={meal.name}
                  icon={getMealIcon(meal.name)}
                  description={meal.description ?? "Freshly prepared daily meal"}
                  price={Number(meal.price)}
                  initialSelected={selectedIds.has(meal.id)}
                  date={todayStr}
                  disabled={!mealSelectionEnabled || isPastDeadline}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Cost Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border/50 rounded-2xl p-6 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Today&apos;s Estimated Cost</h3>
        <p className="text-4xl font-heading font-bold text-primary">
          ৳{estimatedCost.toFixed(2)}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          Based on {selectedIds.size} meal{selectedIds.size !== 1 ? "s" : ""} selected for today
        </p>
      </motion.div>
    </motion.div>
  );
}
