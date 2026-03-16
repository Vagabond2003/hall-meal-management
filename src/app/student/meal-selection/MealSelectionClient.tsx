"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, parseISO, startOfDay, isBefore, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from "date-fns";
import { Loader2, Lock, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MessageSquare } from "lucide-react";
import FeedbackModal from "@/components/FeedbackModal";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { format12h } from "@/lib/utils";

type MealSlot = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
};

type MenuEntry = {
  id: string;
  date: string;
  meal_slot: string;
  items: string;
  price: number;
};

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function MealSelectionClient() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "";
  const tokenNumber = session?.user?.token_number ?? "";
  const [deadline, setDeadline] = useState("10:00 PM");
  const [rawDeadline, setRawDeadline] = useState("22:00:00");

  const currentMonthName = new Date().toLocaleString("en-US", {
    month: "long", year: "numeric", timeZone: "Asia/Dhaka"
  });

  const [activeTab, setActiveTab] = useState<"today" | "week" | "calendar">("week");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [slots, setSlots] = useState<MealSlot[]>([]);
  
  // State for Rolling 7 Days & Today
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [selections, setSelections] = useState<string[]>([]);
  
  // State for Calendar Tab
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [calendarMenus, setCalendarMenus] = useState<MenuEntry[]>([]);
  const [calendarSelections, setCalendarSelections] = useState<string[]>([]);
  
  // Navigation Offsets
  const [weekOffset, setWeekOffset] = useState(0);
  const [todayOffset, setTodayOffset] = useState(0);

  // Computed base dates
  const weekBaseDate = addDays(currentDate, weekOffset * 7);
  const todayViewDate = addDays(currentDate, todayOffset);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  
  // Track ongoing toggles to prevent race conditions
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    weeklyMenuId: string;
    date: string;
    mealName: string;
    mealItems: string;
  } | null>(null);

  // Fetch initial data for today/week based on offset
  useEffect(() => {
    if (activeTab !== "calendar") {
      fetchData();
    }
  }, [weekOffset, todayOffset, activeTab]);

  // Fetch data for calendar whenever the viewed month changes, but only if calendar tab is active
  // Actually, let's fetch calendar data immediately when switching to the tab or changing month
  useEffect(() => {
    if (activeTab === "calendar") {
      fetchMonthData(calendarMonth);
    }
  }, [activeTab, calendarMonth]);

  useEffect(() => {
    fetch("/api/student/settings")
      .then(res => res.json())
      .then(data => {
        if (data.deadline) {
          setDeadline(format12h(data.deadline));
          setRawDeadline(data.deadline);
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Compute date range
      const base = activeTab === "today"
        ? addDays(startOfDay(new Date()), todayOffset)
        : addDays(startOfDay(new Date()), weekOffset * 7);
      const todayStr = fmt(base);
      const endDateStr = fmt(addDays(base, activeTab === "today" ? 0 : 6));

      // Fire ALL requests in parallel
      const [slotsRes, menuRes, selRes] = await Promise.all([
        slots.length === 0 ? fetch('/api/admin/meal-slots') : Promise.resolve(null),
        fetch(`/api/student/weekly-menu?startDate=${todayStr}&endDate=${endDateStr}`),
        fetch(`/api/student/selections?startDate=${todayStr}&endDate=${endDateStr}`),
      ]);

      // Process slots (only if we fetched them)
      if (slotsRes && slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setSlots(slotsData.slots?.filter((s: MealSlot) => s.is_active) || []);
      }

      // Process menus
      if (!menuRes.ok) throw new Error("Failed to fetch menus");
      const menuData = await menuRes.json();
      if (slots.length === 0 && menuData.slots) {
        setSlots(menuData.slots);
      }
      setMenus(menuData.menus || []);

      // Process selections
      if (!selRes.ok) throw new Error("Failed to fetch selections");
      const selData = await selRes.json();
      setSelections(selData.selections?.map((s: any) => s.weekly_menu_id || s.meal_id) || []);

    } catch (err) {
      toast.error("Failed to load meal data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthData = async (monthDate: Date) => {
    setIsCalendarLoading(true);
    try {
       // Clear old calendar data immediately for UI feedback
       setCalendarMenus([]);
       
       const year = monthDate.getFullYear();
       const month = monthDate.getMonth();
       const lastDay = new Date(year, month + 1, 0).getDate();
       
       const startDateStr = fmt(new Date(year, month, 1));
       const endDateStr = fmt(new Date(year, month, lastDay));

       // Fetch global slots just in case
       if (slots.length === 0) {
          const slotsRes = await fetch('/api/admin/meal-slots');
          if (slotsRes.ok) {
             const slotsData = await slotsRes.json();
             setSlots(slotsData.slots?.filter((s: MealSlot) => s.is_active) || []);
          }
       }

       const [menuRes, selRes] = await Promise.all([
          fetch(`/api/student/weekly-menu?startDate=${startDateStr}&endDate=${endDateStr}`),
          fetch(`/api/student/selections?startDate=${startDateStr}&endDate=${endDateStr}`)
       ]);

       if (!menuRes.ok || !selRes.ok) throw new Error("Failed to fetch calendar data");

       const menuData = await menuRes.json();
       const selData = await selRes.json();

       setCalendarMenus(menuData.menus || []);
       setCalendarSelections(selData.selections?.map((s: any) => s.weekly_menu_id || s.meal_id) || []);
    } catch (error) {
       toast.error("Failed to load calendar data");
    } finally {
       setIsCalendarLoading(false);
    }
  };

  const getActiveMenus = () => activeTab === "calendar" ? calendarMenus : menus;
  const getActiveSelections = () => activeTab === "calendar" ? calendarSelections : selections;
  
  const getMenuForCell = (dateStr: string, slotName: string) => {
    return getActiveMenus().find(m => m.date === dateStr && m.meal_slot === slotName);
  };

  const isSelected = (menuId: string) => getActiveSelections().includes(menuId);

  const isLocked = (dateStr: string) => {
    const targetDate = startOfDay(parseISO(dateStr));
    const today = startOfDay(currentDate);
    
    // Past dates are locked
    if (isBefore(targetDate, today)) return true;
    
    // For today, after the deadline
    if (isSameDay(targetDate, today)) {
       const dhakaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
       const [cutoffHour, cutoffMinute] = rawDeadline.split(":").map(Number);
       
       if (dhakaTime.getHours() > cutoffHour || (dhakaTime.getHours() === cutoffHour && dhakaTime.getMinutes() >= cutoffMinute)) {
         return true;
       }
    }
    
    return false;
  };

  const isFutureDate = (dateStr: string): boolean => {
    const bdToday = fmt(new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
    ))
    return dateStr > bdToday
  }

  const handleToggle = async (menu: MenuEntry) => {
    const isCurrentlySelected = isSelected(menu.id);
    const dateStr = menu.date;
    
    if (isLocked(dateStr)) return;
    
    const cellKey = `${menu.id}`;
    if (togglingCells.has(cellKey)) return;
    
    // Optimistic UI updates
    setTogglingCells(prev => new Set(prev).add(cellKey));
    
    const updateSelections = (prev: string[]) => isCurrentlySelected 
      ? prev.filter(id => id !== menu.id) 
      : [...prev, menu.id];

    if (activeTab === "calendar") {
       setCalendarSelections(updateSelections);
    } else {
       setSelections(updateSelections);
    }

    try {
      const res = await fetch("/api/student/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: menu.id,
          date: dateStr,
          is_selected: !isCurrentlySelected,
        })
      });
      
      if (!res.ok) throw new Error("Update failed");
      
    } catch (err) {
      toast.error("Failed to save selection");
      // Revert optimistic update
      const revertSelections = (prev: string[]) => isCurrentlySelected 
        ? [...prev, menu.id] 
        : prev.filter(id => id !== menu.id);
        
      if (activeTab === "calendar") {
         setCalendarSelections(revertSelections);
      } else {
         setSelections(revertSelections);
      }
    } finally {
      setTogglingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const calculateTotalCost = () => {
    return getActiveMenus()
      .filter(m => getActiveSelections().includes(m.id))
      .reduce((sum, m) => sum + (m.price || 0), 0);
  };

  const handleBulkToggle = async (action: "on" | "off") => {
    const fromDate = fmt(selectedDate);
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/student/bulk-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_date: fromDate, action }),
      });
      if (!res.ok) throw new Error("Bulk update failed");
      
      // Refresh calendar data to reflect changes
      await fetchMonthData(calendarMonth);
      toast.success(
        action === "off"
          ? "All meals turned off from " + fromDate + " onwards"
          : "All meals turned on from " + fromDate + " onwards"
      );
    } catch {
      toast.error("Failed to update meals. Please try again.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Header for week days
    const daysHeader = (
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayStr = fmt(cloneDay);
        const isSameMonthDate = isSameMonth(day, monthStart);
        const isSelectedDate = isSameDay(day, selectedDate);
        const isTodayDate = isSameDay(day, currentDate);
        const isPastDate = isBefore(day, startOfDay(currentDate));

        // Calculate dot
        const menusForDay = calendarMenus.filter(m => m.date === dayStr);
        let dotColor = null;
        if (menusForDay.length > 0) {
           const selectedForDay = menusForDay.filter(m => calendarSelections.includes(m.id)).length;
           if (selectedForDay === menusForDay.length) {
              dotColor = "bg-green-500";
           } else if (selectedForDay > 0) {
              dotColor = "bg-amber-500";
           } else {
              dotColor = "bg-gray-300"; 
           }
        }

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              if (isSameMonthDate) setSelectedDate(cloneDay);
            }}
            className={`
              relative p-2 min-h-[80px] sm:min-h-[100px] border-b border-r border-[#E4E2DA] flex flex-col items-center justify-start
              ${!isSameMonthDate ? "opacity-40 bg-gray-50 cursor-default" : "cursor-pointer transition-colors"}
              ${isSelectedDate && isSameMonthDate ? "bg-[#1A3A2A] hover:bg-[#1A3A2A]" : ""}
              ${isTodayDate && !isSelectedDate && isSameMonthDate ? "bg-[#E8F5E9] hover:bg-[#C8E6C9]" : ""}
              ${!isSelectedDate && !isTodayDate && isSameMonthDate ? "hover:bg-gray-50 bg-white" : ""}
              ${isPastDate && isSameMonthDate && !isSelectedDate ? "bg-gray-50/50" : ""}
            `}
          >
            <span className={`text-sm mt-1 ${isSelectedDate && isSameMonthDate ? "font-medium text-white" : "text-[#1A3A2A]"} ${isTodayDate && !isSelectedDate ? "font-medium" : ""}`}>{formattedDate}</span>
            {dotColor && isSameMonthDate && (
               <div className={`absolute bottom-3 w-2 h-2 rounded-full shadow-sm ${dotColor}`} />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#1A3A2A] text-white p-4 flex justify-between items-center rounded-t-xl shrink-0">
          <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-medium text-lg text-[#C4873A]">
            {format(calendarMonth, "MMMM yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setCalendarMonth(startOfMonth(currentDate)); setSelectedDate(currentDate); }} className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded font-medium transition-colors">
              Today
            </button>
            <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-2 sm:p-4 flex-1 flex flex-col">
          {daysHeader}
          <div className="flex-1 flex flex-col border-t border-l border-[#E4E2DA]">
            {rows}
          </div>
        </div>
      </div>
    );
  };

  const renderMealDetails = () => {
    const dateStr = fmt(selectedDate);
    const locked = isLocked(dateStr);
    
    let subtitleLabel = "Upcoming — select your meals";
    if (isBefore(selectedDate, startOfDay(currentDate))) subtitleLabel = "Past date — view only";
    else if (isSameDay(selectedDate, currentDate)) subtitleLabel = "Today — check cutoff time"; 

    const activeMenusForDay = slots.map(slot => {
       const menu = getMenuForCell(dateStr, slot.name);
       return { slot, menu };
    });

    const dailySelectedTotal = activeMenusForDay.reduce((sum, item) => {
       if (item.menu && isSelected(item.menu.id)) {
          return sum + (item.menu.price || 0);
       }
       return sum;
    }, 0);

    return (
      <div className="flex flex-col h-full max-h-full">
        <div className="bg-[#1A3A2A] p-4 text-white rounded-t-xl shrink-0">
          <div className="font-medium text-lg">{format(selectedDate, "EEEE, d MMMM yyyy")}</div>
          <div className="text-[#C4873A] text-sm mt-0.5">{subtitleLabel}</div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[480px] flex-1">
          {isCalendarLoading ? (
             <div className="flex justify-center items-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-[#1A3A2A]" />
             </div>
          ) : activeMenusForDay.length > 0 ? (
             <div className="space-y-3">
               {activeMenusForDay.map(({ slot, menu }) => (
                 <div key={slot.id} className={`border border-[#E4E2DA] rounded-lg p-3 sm:p-4 transition-colors ${menu && isSelected(menu.id) ? 'bg-[#E8F5E9] border-[#1A3A2A]' : 'bg-white'}`}>
                   <div className="flex justify-between items-start gap-4">
                     <div>
                       <div className="font-medium text-[#1A3A2A] text-sm uppercase tracking-wider mb-1">{slot.name}</div>
                       {menu ? (
                         <div className="text-sm text-gray-700 whitespace-pre-wrap">{menu.items}</div>
                       ) : (
                         <div className="text-sm text-gray-400 italic">No menu set</div>
                       )}
                     </div>
                     {menu && (
                        <div className="flex flex-col items-end shrink-0 gap-3">
                           <div className="text-sm font-medium text-[#C4873A] bg-amber-50 px-2 py-0.5 rounded">
                             ৳ {menu.price}
                           </div>
                           <div>
                              {locked ? (
                                <div className="p-1.5 rounded-full bg-gray-100 text-gray-400" title="Locked">
                                  <Lock className="w-4 h-4" />
                                </div>
                              ) : (
                                <button
                                   onClick={() => handleToggle(menu)}
                                   disabled={togglingCells.has(menu.id)}
                                   className={`relative inline-flex h-8 w-14 sm:h-5 sm:w-9 items-center rounded-full transition-colors ${
                                     isSelected(menu.id) ? 'bg-green-500' : 'bg-gray-300'
                                   } ${togglingCells.has(menu.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                   <span
                                     className={`inline-block h-6 w-6 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                                       isSelected(menu.id) ? 'translate-x-7 sm:translate-x-5' : 'translate-x-1'
                                     }`}
                                   />
                                 </button>
                              )}
                           </div>
                        </div>
                     )}
                     {menu && !isFutureDate(dateStr) && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setFeedbackModal({
                             weeklyMenuId: menu.id,
                             date: dateStr,
                             mealName: slot.name,
                             mealItems: menu.items,
                           });
                         }}
                         className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1A3A2A] transition-colors mt-1"
                         title="Give feedback"
                       >
                         <MessageSquare className="w-3.5 h-3.5" />
                         <span>See Feedback</span>
                       </button>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          ) : (
             <div className="flex justify-center items-center py-12 text-gray-500">
               No classes scheduled
             </div>
          )}
        </div>
        
        {!isBefore(selectedDate, startOfDay(currentDate)) && (
          <div className="px-4 py-3 border-t border-[#E4E2DA] bg-white flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleBulkToggle("off")}
              disabled={isBulkLoading}
              className="flex-1 py-2 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkLoading ? "Processing..." : "⏸ Turn off all meals from this day onwards"}
            </button>
            <button
              onClick={() => handleBulkToggle("on")}
              disabled={isBulkLoading}
              className="flex-1 py-2 px-4 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkLoading ? "Processing..." : "▶ Turn on all meals from this day onwards"}
            </button>
          </div>
        )}

        <div className="bg-gray-50 border-t border-[#E4E2DA] p-4 shrink-0 rounded-b-xl flex justify-between items-center">
          <div className="font-medium text-[#1A3A2A]">Total selected:</div>
          <div className="text-lg font-bold text-[#1A3A2A]">৳{dailySelectedTotal}</div>
        </div>
      </div>
    );
  };

  const daysToShow = activeTab === "today" ? [0] : [0, 1, 2, 3, 4, 5, 6];

  if (isLoading) {
    return (
       <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3A2A]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: "linear-gradient(135deg, #1A3A2A 0%, #2D5A40 60%, #1A3A2A 100%)",
        }}
      >
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A2A]">Meal Selection</h1>
          <p className="text-sm text-gray-500">Choose your meals for the upcoming week</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-[#E4E2DA]">
          <button
            onClick={() => { setActiveTab("week"); setWeekOffset(0); }}
            className={`px-4 flex-1 sm:flex-none py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md transition-colors ${
              activeTab === "week" ? "bg-[#1A3A2A] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Weekly Menu
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 flex-1 sm:flex-none py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md transition-colors ${
              activeTab === "calendar" ? "bg-[#1A3A2A] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => { setActiveTab("today"); setTodayOffset(0); }}
            className={`px-4 flex-1 sm:flex-none py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md transition-colors ${
              activeTab === "today" ? "bg-[#1A3A2A] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E4E2DA] shadow-sm overflow-hidden flex flex-col">
            {renderCalendar()}
          </div>
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E4E2DA] shadow-sm overflow-hidden flex flex-col lg:sticky lg:top-24 min-h-[400px]">
            {renderMealDetails()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(activeTab === "week" || activeTab === "today") && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-[#E4E2DA] shadow-sm">
              <button
                onClick={() => {
                  if (activeTab === "today") setTodayOffset(prev => prev - 1);
                  else setWeekOffset(prev => prev - 1);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DA] text-[#1A3A2A] hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                {activeTab === "today" ? "Previous day" : "Previous week"}
              </button>

              <div className="flex flex-col items-center">
                <span className="text-sm font-semibold text-[#1A3A2A]">
                  {activeTab === "today"
                    ? format(addDays(currentDate, todayOffset), "EEEE, MMM d yyyy")
                    : `${format(addDays(currentDate, weekOffset * 7), "MMM d")} – ${format(addDays(currentDate, weekOffset * 7 + 6), "MMM d, yyyy")}`
                  }
                </span>
                {(weekOffset !== 0 || todayOffset !== 0) && (
                  <button
                    onClick={() => {
                      setWeekOffset(0);
                      setTodayOffset(0);
                    }}
                    className="text-xs text-[#C4873A] hover:underline mt-0.5"
                  >
                    Back to today
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  if (activeTab === "today") setTodayOffset(prev => prev + 1);
                  else setWeekOffset(prev => prev + 1);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DA] text-[#1A3A2A] hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {activeTab === "today" ? "Next day" : "Next week"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-xl border border-[#E4E2DA] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#1A3A2A]">
                  <th className="py-3 px-4 font-medium text-[#C4873A] text-xs uppercase tracking-wider border-b border-r border-[#153022] sticky left-0 z-10 bg-[#1A3A2A] shadow-[2px_0_5px_rgba(0,0,0,0.1)] w-[120px]">
                    Day
                  </th>
                  {slots.map(slot => (
                    <th key={slot.id} className="py-3 px-4 font-medium text-[#C4873A] text-xs uppercase tracking-wider border-b border-r border-[#153022] last:border-r-0 min-w-[200px]">
                      {slot.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E2DA]">
                {daysToShow.map(i => {
                  const dayDate = activeTab === "today"
                    ? addDays(currentDate, todayOffset)
                    : addDays(currentDate, weekOffset * 7 + i);
                  const dateStr = format(dayDate, "yyyy-MM-dd");
                  const isToday = isSameDay(dayDate, currentDate);
                  
                  return (
                    <tr key={i} className="hover:bg-gray-50 group">
                      <td className="py-3 px-4 border-r border-[#E4E2DA] sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-top">
                        <div className="font-medium text-[#1A3A2A] flex items-center gap-2">
                          {format(dayDate, "EEEE")}
                          {isToday && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Today</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{format(dayDate, "MMM d")}</div>
                      </td>
                      
                      {slots.map(slot => {
                        const menu = getMenuForCell(dateStr, slot.name);
                        
                        if (!menu) {
                          return (
                            <td key={slot.id} className="py-3 px-4 border-r border-[#E4E2DA] last:border-r-0 align-middle text-center min-h-[80px]">
                              <span className="text-gray-300 font-bold">—</span>
                            </td>
                          );
                        }
                        
                        const selected = isSelected(menu.id);
                        const locked = isLocked(dateStr);
                        const isToggling = togglingCells.has(menu.id);
                        
                        return (
                          <td 
                            key={slot.id} 
                            className={`py-3 px-4 border-r border-[#E4E2DA] last:border-r-0 align-top min-h-[80px] transition-colors relative ${selected ? 'bg-[#E8F5E9] group-hover:bg-[#C8E6C9]' : ''}`}
                          >
                            <div className="flex flex-col h-full">
                              <div className="text-sm text-[#1A3A2A] whitespace-pre-wrap flex-grow pr-8">
                                {menu.items}
                              </div>
                              
                              <div className="flex justify-between items-end mt-3">
                                <div className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  ৳ {menu.price}
                                </div>
                                
                                <div className="absolute top-3 right-3">
                                  {locked ? (
                                    <div className="p-1 rounded-full bg-gray-100 text-gray-400" title="Locked">
                                      <Lock className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <button
                                       onClick={() => handleToggle(menu)}
                                       disabled={isToggling}
                                       className={`relative inline-flex h-8 w-14 sm:h-5 sm:w-9 items-center rounded-full transition-colors ${
                                         selected ? 'bg-green-500' : 'bg-gray-300'
                                       } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                     >
                                       <span
                                         className={`inline-block h-6 w-6 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                                           selected ? 'translate-x-7 sm:translate-x-5' : 'translate-x-1'
                                         }`}
                                       />
                                     </button>
                                  )}
                                </div>
                              </div>
                            </div>
                                {menu && !isFutureDate(dateStr) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackModal({
                                        weeklyMenuId: menu.id,
                                        date: dateStr,
                                        mealName: slot.name,
                                        mealItems: menu.items,
                                      });
                                    }}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1A3A2A] transition-colors mt-1"
                                    title="Give feedback"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>See Feedback</span>
                                  </button>
                                )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
      
      <div className="bg-white p-4 rounded-xl border border-[#E4E2DA] shadow-sm flex flex-col sm:flex-row justify-between items-center text-[#1A3A2A] gap-2">
        <div className="font-medium text-sm sm:text-base">
          {activeTab === "calendar" 
            ? `Total Estimated Cost (${format(calendarMonth, 'MMMM yyyy')}):` 
            : 'Total Estimated Cost (Selected Window):'}
        </div>
        <div className="text-xl font-bold bg-[#E8F5E9] text-green-800 px-3 py-1 rounded-lg">
          ৳ {calculateTotalCost()}
        </div>
      </div>

      {feedbackModal && (
        <FeedbackModal
          weeklyMenuId={feedbackModal.weeklyMenuId}
          date={feedbackModal.date}
          mealName={feedbackModal.mealName}
          mealItems={feedbackModal.mealItems}
          onClose={() => setFeedbackModal(null)}
          currentUserId={session?.user?.id ?? ''}
          isAdmin={false}
        />
      )}
    </div>
  );
}
