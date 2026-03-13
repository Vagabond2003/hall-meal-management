"use client";

import { useState, useEffect } from "react";
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
  Sunrise,
  Sun,
  Moon,
  ArrowRight,
  Megaphone,
  Heart,
  Siren,
  AlertTriangle
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

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  created_at: string;
  is_read: boolean;
  is_liked: boolean;
  like_count?: number;
}

interface DashboardClientProps {
  userName: string;
  tokenNumber: string;
  totalMeals: number;
  totalCost: number;
  uniqueDays: number;
  isActive: boolean;
  isApproved: boolean;
  mealSelectionEnabled: boolean;
  deadline: string;
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
  tokenNumber,
  totalMeals,
  totalCost,
  uniqueDays,
  isActive,
  isApproved,
  mealSelectionEnabled,
  deadline,
  currentMonthName,
}: DashboardClientProps) {
  const [regularMeals, setRegularMeals] = useState<Meal[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [localToday, setLocalToday] = useState<string>("");
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchLocalData = async () => {
      const todayObj = new Date();
      const dateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
      setLocalToday(dateStr);

      // Parse deadline for local check
      const dlMatch = deadline.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (dlMatch) {
        let dh = parseInt(dlMatch[1]);
        const dm = parseInt(dlMatch[2]);
        const period = dlMatch[3].toUpperCase();
        if (period === "PM" && dh < 12) dh += 12;
        if (period === "AM" && dh === 12) dh = 0;
        const dlTime = new Date();
        dlTime.setHours(dh, dm, 0, 0);
        setIsPastDeadline(todayObj > dlTime);
      }

      try {
        const [menuRes, selRes, annRes] = await Promise.all([
          fetch(`/api/student/daily-menu?date=${dateStr}`, { cache: 'no-store' }),
          fetch(`/api/student/selections?date=${dateStr}`, { cache: 'no-store' }),
          fetch("/api/announcements")
        ]);

        if (menuRes.ok) {
          const { menus } = await menuRes.json();
          if (menus && menus.length > 0) {
            // Build meal cards directly from weekly_menus data
            const menuMeals: Meal[] = menus.map((m: any) => ({
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

        if (selRes.ok) {
          const selData = await selRes.json();
          const selected = (selData.selections ?? []).map((s: any) => s.weekly_menu_id ?? s.meal_id).filter(Boolean);
          setSelectedMealIds(selected);
          // Special meals are no longer sourced from the old meals table.
          // All meal data comes from weekly_menus via /api/student/daily-menu.
        }

        if (annRes.ok) {
          const annData = await annRes.json();
          // Take only the 3 most recent
          setAnnouncements((annData.announcements || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch local data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalData();
  }, [deadline]);

  const handleAnnouncementInteract = async (id: string, action: "read" | "like") => {
    // Optimistic update
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== id) return ann;
      return {
        ...ann,
        is_read: action === "read" ? true : ann.is_read,
        is_liked: action === "like" ? !ann.is_liked : ann.is_liked
      };
    }));

    try {
      const ann = announcements.find(a => a.id === id);
      const is_read = action === "read" ? true : undefined;
      const is_liked = action === "like" ? !ann?.is_liked : undefined;

      await fetch(`/api/announcements/${id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read, is_liked })
      });
    } catch (error) {
      console.error("Failed to update announcement interaction", error);
    }
  };

  const PriorityBadgeConfig = {
    normal: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: null },
    important: { bg: "bg-warning/10 text-warning", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
    urgent: { bg: "bg-danger/10 text-danger", icon: <Siren className="w-3.5 h-3.5 mr-1" /> }
  };

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
            {tokenNumber && (
              <span className="inline-block mt-2 bg-accent-gold/20 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
                Token: {tokenNumber}
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

      {/* Announcements */}
      {!loading && announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text-primary">Announcements</h2>
          </div>
          
          <div className="grid gap-3">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={`bg-white dark:bg-surface border border-border/50 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-4 transition-all ${ann.is_read ? 'opacity-85' : ''}`}
              >
                {!ann.is_read && ann.priority === "urgent" && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger"></div>
                )}
                {!ann.is_read && ann.priority === "important" && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-warning"></div>
                )}
                {!ann.is_read && ann.priority === "normal" && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-300 dark:bg-slate-600"></div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${PriorityBadgeConfig[ann.priority].bg}`}>
                      {PriorityBadgeConfig[ann.priority].icon}
                      {ann.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-heading font-bold text-text-primary truncate">{ann.title}</h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2 font-sans">{ann.body}</p>
                </div>

                <div className="flex items-center sm:flex-col justify-end gap-2 mt-2 sm:mt-0 sm:min-w-[100px]">
                  <button
                    onClick={() => handleAnnouncementInteract(ann.id, "like")}
                    className={`p-2 rounded-full transition-colors flex items-center justify-center border ${ann.is_liked ? "bg-accent-gold/10 text-accent-gold border-accent-gold/20" : "bg-slate-50 text-slate-400 border-border/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"}`}
                  >
                    <Heart className={`w-4 h-4 ${ann.is_liked ? "fill-current" : ""}`} />
                  </button>
                  {!ann.is_read && (
                    <button
                      onClick={() => handleAnnouncementInteract(ann.id, "read")}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-right mt-2">
            <Link 
              href="/student/announcements" 
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
            >
              View All Announcements <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

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
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : regularMeals.length === 0 ? (
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {regularMeals.map((meal) => (
              <motion.div key={`${meal.id}-${selectedMealIds.includes(meal.id)}`} variants={itemVariants}>
                <MealToggleCard
                  mealId={meal.id}
                  name={meal.name}
                  icon={getMealIcon(meal.name)}
                  description={meal.description ?? ""}
                  price={Number(meal.price)}
                  isSelected={selectedMealIds.includes(meal.id)}
                  date={localToday}
                  disabled={!mealSelectionEnabled || isPastDeadline}
                  onToggle={(mealId, selected) => {
                    setSelectedMealIds(prev => 
                      selected ? [...prev, mealId] : prev.filter(id => id !== mealId)
                    );
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>



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
