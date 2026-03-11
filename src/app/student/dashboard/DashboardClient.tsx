"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/shared/StatCard";
import { MealToggleCard } from "@/components/shared/MealToggleCard";
import {
  UtensilsCrossed,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  Star,
  Sunrise,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  meal_type: string;
  date: string | null;
  hasMenu?: boolean;
}

interface DashboardClientProps {
  userName: string;
  rnaNumber: string;
  totalMeals: number;
  totalCost: number;
  uniqueDays: number;
  isActive: boolean;
  isApproved: boolean;
  mealSelectionEnabled: boolean;
  regularMeals: Meal[];
  specialMeals: Meal[];
  selectedMealIds: string[];
  today: string;
  deadline: string;
  isPastDeadline: boolean;
  currentMonthName: string;
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

export function DashboardClient({
  userName,
  rnaNumber,
  totalMeals,
  totalCost,
  uniqueDays,
  isActive,
  isApproved,
  mealSelectionEnabled,
  regularMeals,
  specialMeals,
  selectedMealIds,
  today,
  deadline,
  isPastDeadline,
  currentMonthName,
}: DashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: "linear-gradient(135deg, #1A3A2A 0%, #2D5A40 60%, #1A3A2A 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-heading font-bold text-white">{userName}</h1>
            {rnaNumber && (
              <span className="inline-block mt-2 bg-accent-gold/20 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
                RNA: {rnaNumber}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">{currentMonthName}</p>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-1 justify-end">
              <Clock className="w-4 h-4" />
              Daily cutoff: {deadline}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 4 Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label="Meals This Month"
            value={totalMeals}
            icon={<UtensilsCrossed className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/10"
            caption={currentMonthName}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Estimated Cost"
            value={Math.round(totalCost)}
            icon={<Receipt className="w-5 h-5 text-accent-gold" />}
            iconBg="bg-accent-gold/10"
            prefix="৳"
            caption="Current month total"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Days Active"
            value={uniqueDays}
            icon={<Calendar className="w-5 h-5 text-info" />}
            iconBg="bg-info/10"
            caption="Days with meal selections"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Account Status"
            value={isActive ? "Active" : "Inactive"}
            icon={
              isActive ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-danger" />
              )
            }
            iconBg={isActive ? "bg-success/10" : "bg-danger/10"}
            caption={isApproved ? "Approved by Admin" : "Pending Approval"}
            isText
          />
        </motion.div>
      </motion.div>

      {/* Today's Selections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-text-primary">Today&apos;s Selections</h2>
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Cutoff: {deadline}
          </span>
        </div>

        {/* Restriction banners */}
        {!mealSelectionEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mb-4 bg-danger/8 border border-danger/20 rounded-xl text-danger"
          >
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Your meal selection has been disabled due to an outstanding bill. Please contact the admin.
            </p>
          </motion.div>
        )}

        {isPastDeadline && mealSelectionEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mb-4 bg-warning/8 border border-warning/20 rounded-xl text-warning"
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Today&apos;s selection deadline has passed ({deadline}). Your current selections have been locked.
            </p>
          </motion.div>
        )}

        {/* Regular meal toggles */}
        {regularMeals.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            No regular meals configured yet. Contact your admin.
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {/* NO MENU SET ENTIRE DAY BANNER */}
            {regularMeals.every(m => !m.hasMenu) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-500"
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  No menu has been set for today. Check back later.
                </p>
              </motion.div>
            )}

            {regularMeals.map((meal) => (
              <motion.div key={meal.id} variants={itemVariants}>
                {!meal.hasMenu ? (
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-surface/50 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="text-text-secondary">{getMealIcon(meal.name)}</div>
                      <div>
                        <h3 className="font-heading font-semibold text-text-primary text-sm">{meal.name}</h3>
                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> Menu not set yet
                        </p>
                      </div>
                    </div>
                    {/* Fake disabled toggle */}
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full cursor-not-allowed opacity-50 relative">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all" />
                    </div>
                  </div>
                ) : (
                  <MealToggleCard
                    mealId={meal.id}
                    name={meal.name}
                    icon={getMealIcon(meal.name)}
                    description={meal.description ?? ""}
                    price={Number(meal.price)}
                    initialSelected={selectedMealIds.includes(meal.id)}
                    date={today}
                    disabled={!mealSelectionEnabled || isPastDeadline}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Special Meals */}
      {specialMeals.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-gold" />
            Special Meals Available
          </h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {specialMeals.map((meal) => (
              <motion.div key={meal.id} variants={itemVariants}>
                <div className="text-xs text-accent-gold font-medium mb-1 ml-1">
                  📅 {meal.date}
                </div>
                <MealToggleCard
                  mealId={meal.id}
                  name={meal.name}
                  icon={<Star className="w-5 h-5" />}
                  description={meal.description ?? ""}
                  price={Number(meal.price)}
                  initialSelected={selectedMealIds.includes(meal.id)}
                  date={meal.date ?? today}
                  disabled={!mealSelectionEnabled || (meal.date === today && isPastDeadline)}
                  isSpecial
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
            <Link
              href="/student/history"
              className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border/50 shadow-sm group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Meal History</p>
                  <p className="text-xs text-text-secondary">View past meals by month</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
            <Link
              href="/student/billing"
              className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border/50 shadow-sm group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Billing Summary</p>
                  <p className="text-xs text-text-secondary">Monthly costs and payment status</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-gold transition-colors" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
