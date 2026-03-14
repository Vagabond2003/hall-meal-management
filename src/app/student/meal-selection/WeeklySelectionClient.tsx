"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Utensils, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

interface Menu {
  id: string;
  date: string;
  meal_slot: string;
  items: string;
  price: number;
}

interface Selection {
  id: string;
  date: string;
  is_selected: boolean;
  weekly_menu_id: string;
  price: number;
}

export default function WeeklySelectionClient() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({ startDate: "", endDate: "" });
  const [deadline, setDeadline] = useState<string>("22:00:00");

  // Prevent double toggles and track in-flight requests per meal+date
  const inFlightRequests = useRef<Set<string>>(new Set());
  const todayRef = useRef<HTMLDivElement>(null);

  // Define week days
  const [weekDays, setWeekDays] = useState<{ dateStr: string; dayIndex: number; dateObj: Date; isToday: boolean; isPast: boolean; isDeadlinePassed: boolean }[]>([]);

  const fetchDeadline = async () => {
    try {
      const res = await fetch(`/api/student/settings?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.deadline) setDeadline(data.deadline);
      }
    } catch {
      // Settings fetch failed — use defaults
    }
  };

  const calculateWeekAndDeadlines = useCallback(() => {
    const today = new Date();
    
    // Safe date formatter to avoid timezone shifting
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const [dh, dm] = deadline.split(":").map(Number);
    const deadlineTime = new Date();
    deadlineTime.setHours(dh, dm, 0, 0);

    // Rolling 7-day window: today + next 6 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);

      const dateStr = fmt(dayDate);
      const isToday = i === 0;
      const isPast = false; // rolling window: all days are today or future
      const isDeadlinePassed = isToday && today > deadlineTime;

      return {
        dateStr,
        dayIndex: dayDate.getDay(), // actual weekday index (0=Sun)
        dateObj: dayDate,
        isToday,
        isPast,
        isDeadlinePassed,
      };
    });
    
    setWeekDays(days);
    if (days.length > 0) {
        setDateRange({ startDate: days[0].dateStr, endDate: days[days.length - 1].dateStr });
    }
  }, [deadline]);

  useEffect(() => {
    fetchDeadline();
  }, []);

  useEffect(() => {
    if (deadline) {
      calculateWeekAndDeadlines();
    }
  }, [deadline, calculateWeekAndDeadlines]);

  const fetchData = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    setLoading(true);
    try {
      const [menuResult, selectResult] = await Promise.allSettled([
        fetch(`/api/student/weekly-menu?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/student/selections?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&t=${Date.now()}`, { cache: 'no-store' })
      ]);

      if (menuResult.status === 'fulfilled' && menuResult.value.ok) {
        const menuData = await menuResult.value.json();
        setMenus(menuData.menus || []);
      }
      if (selectResult.status === 'fulfilled' && selectResult.value.ok) {
        const selectData = await selectResult.value.json();
        setSelections(selectData.selections || []);
      }

      if (menuResult.status === 'rejected' && selectResult.status === 'rejected') {
        toast.error("Failed to load weekly menu");
      }
    } catch {
      toast.error("Failed to load weekly menu");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && weekDays.length > 0) {
      // scroll to today on mobile
      const timer = setTimeout(() => {
        if (todayRef.current) {
          todayRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, weekDays]);

  const handleToggle = async (menuId: string, dateStr: string, currentStatus: boolean, price: number) => {
    // Optimistic toggle
    const flightKey = `${menuId}-${dateStr}`;
    if (inFlightRequests.current.has(flightKey)) return;

    inFlightRequests.current.add(flightKey);
    const newStatus = !currentStatus;

    // Optimistic UI update
    setSelections(prev => {
      const exists = prev.find(s => s.weekly_menu_id === menuId && s.date === dateStr);
      if (exists) {
        return prev.map(s => 
          s.weekly_menu_id === menuId && s.date === dateStr ? { ...s, is_selected: newStatus } : s
        );
      } else {
        return [...prev, { id: 'temp-' + Date.now(), weekly_menu_id: menuId, date: dateStr, is_selected: newStatus, price }];
      }
    });

    try {
      const res = await fetch(`/api/student/selections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: menuId,
          date: dateStr,
          is_selected: newStatus
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save selection");
      }
      
      toast.success(`Meal selection ${newStatus ? 'added' : 'removed'}`);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      // Revert on failure
      setSelections(prev => {
        const exists = prev.find(s => s.weekly_menu_id === menuId && s.date === dateStr);
        if (exists) {
          return prev.map(s => 
            s.weekly_menu_id === menuId && s.date === dateStr ? { ...s, is_selected: currentStatus } : s
          );
        }
        return prev;
      });
    } finally {
      inFlightRequests.current.delete(flightKey);
    }
  };

  const getDayName = (dayIndex: number) => {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex];
  };

  const totalWeeklyCost = selections
    .filter(s => s.is_selected && s.weekly_menu_id) // Only count selections that exist in week
    .reduce((sum, s) => sum + Number(s.price), 0);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-hidden pt-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="w-[85vw] sm:w-72 shrink-0 h-96 bg-white dark:bg-[#182218] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
        {weekDays.map((day) => {
          const dayMenus = menus.filter(m => m.date === day.dateStr);
          const isLocked = day.isPast || day.isDeadlinePassed;

          return (
            <div 
              key={day.dateStr}
              ref={day.isToday ? todayRef : null}
              className={`w-[85vw] sm:w-[280px] shrink-0 rounded-2xl border snap-center flex flex-col bg-white dark:bg-[#182218] overflow-hidden transition-colors ${
                day.isToday 
                  ? 'border-primary shadow-sm dark:border-primary/50' 
                  : day.isPast || isLocked
                    ? 'border-slate-200 bg-slate-50/50 dark:border-[#2A3A2B] dark:bg-[#1C251D]' 
                    : 'border-slate-100 hover:border-slate-300 dark:border-[#2A3A2B] dark:hover:border-slate-600 shadow-sm'
              }`}
            >
              <div className={`p-4 text-center border-b ${day.isToday ? 'bg-primary/5 border-primary/10' : 'border-slate-100 dark:border-[#2A3A2B]'}`}>
                <p className={`text-sm font-semibold uppercase tracking-wider ${day.isToday ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                  {getDayName(day.dayIndex)}
                </p>
                <p className={`text-2xl font-bold mt-1 ${day.isToday ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day.dateObj.getDate()} {day.dateObj.toLocaleString('en-US', { month: 'short' })}
                </p>
                {day.isPast && <span className="inline-block mt-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-medium dark:bg-slate-800 dark:text-slate-400">Past</span>}
                {day.isToday && <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium dark:bg-green-900/30 dark:text-green-400">Today</span>}
              </div>

              <div className="p-4 flex-1 space-y-4">
                {dayMenus.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
                    <UtensilsCrossed className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No menu set</p>
                  </div>
                ) : (
                  dayMenus.map(menu => {
                    const selection = selections.find(s => s.weekly_menu_id === menu.id && s.date === day.dateStr);
                    const isSelected = selection?.is_selected ?? false;

                    return (
                      <div key={menu.id} className={`p-3 rounded-xl border flex items-center justify-between ${
                        isSelected 
                          ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' 
                          : 'border-slate-100 bg-white dark:border-[#2A3A2B] dark:bg-[#182218]'
                      } ${day.isPast ? 'opacity-60' : ''}`}>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{menu.meal_slot}</p>
                          <p className="text-sm text-primary font-medium mt-0.5 dark:text-primary-light">৳{menu.price}</p>
                        </div>
                        
                        {isLocked ? (
                          <div className={`p-2 rounded-full ${isSelected ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                            <Lock className="w-5 h-5" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggle(menu.id, day.dateStr, isSelected, menu.price)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              isSelected ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          >
                            <span className="sr-only">Toggle {menu.meal_slot}</span>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isSelected ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#EAF2EC] dark:bg-[#1F2B20] border border-[#A3B8AD] dark:border-[#2A3A2B] rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Weekly Estimated Cost</p>
            <p className="text-2xl font-bold text-primary dark:text-white mt-1">৳{totalWeeklyCost}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
