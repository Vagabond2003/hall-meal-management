"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MealToggleCard } from "@/components/shared/MealToggleCard";
import {
  UtensilsCrossed,
  Sunrise,
  Sun,
  Moon,
  Star,
  Clock,
  Lock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_type: string;
  date: string | null;
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
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deadline, setDeadline] = useState("10:00 PM");
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [mealSelectionEnabled, setMealSelectionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "MMMM yyyy");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsRes, selRes] = await Promise.all([
          fetch("/api/student/meals"),
          fetch(`/api/student/selections?date=${today}`),
        ]);

        const mealsData = await mealsRes.json();
        const selData = await selRes.json();

        setMeals(mealsData.meals ?? []);

        // Parse deadline
        const dl: string = mealsData.deadline ?? "22:00:00";
        const [dh, dm] = dl.split(":").map(Number);
        const displayDl = `${dh > 12 ? dh - 12 : dh}:${String(dm).padStart(2, "0")} ${dh >= 12 ? "PM" : "AM"}`;
        setDeadline(displayDl);

        const now = new Date();
        const dlTime = new Date();
        dlTime.setHours(dh, dm, 0, 0);
        setIsPastDeadline(now > dlTime);

        const selected = new Set<string>(
          (selData.selections ?? []).map((s: { meal_id: string }) => s.meal_id)
        );
        setSelectedIds(selected);
      } catch {
        toast.error("Failed to load meal data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [today]);

  const handleToggle = (mealId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(mealId);
      else next.delete(mealId);
      return next;
    });
  };

  const regularMeals = meals.filter((m) => m.meal_type === "regular");
  const specialMeals = meals.filter((m) => m.meal_type === "special");

  const estimatedCost = [...selectedIds].reduce((acc, id) => {
    const meal = meals.find((m) => m.id === id);
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
        <h2 className="text-base font-heading font-semibold text-text-primary mb-3">Regular Meals</h2>
        {regularMeals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-text-secondary">
            <UtensilsCrossed className="w-10 h-10 opacity-30" />
            <p className="text-sm">No regular meals configured. Please contact your admin.</p>
          </div>
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
                  date={today}
                  disabled={!mealSelectionEnabled || isPastDeadline}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Special Meals */}
      {specialMeals.length > 0 && (
        <div>
          <h2 className="text-base font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-accent-gold" />
            Special Meals
          </h2>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-3">
            {specialMeals.map((meal) => (
              <motion.div key={meal.id} variants={itemVariants}>
                <div className="text-xs text-accent-gold font-medium mb-1">
                  📅 {meal.date}
                </div>
                <MealToggleCard
                  mealId={meal.id}
                  name={meal.name}
                  icon={<Star className="w-5 h-5" />}
                  description={meal.description ?? ""}
                  price={Number(meal.price)}
                  initialSelected={selectedIds.has(meal.id)}
                  date={meal.date ?? today}
                  disabled={!mealSelectionEnabled}
                  isSpecial
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

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
