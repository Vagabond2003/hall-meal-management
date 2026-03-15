"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, parseISO, startOfDay, isBefore, isSameDay } from "date-fns";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

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

export default function MealSelectionClient() {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [selections, setSelections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track ongoing toggles to prevent race conditions
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch menus and slots for rolling 7-day window
      const todayStr = format(currentDate, "yyyy-MM-dd");
      const endDateStr = format(addDays(currentDate, 6), "yyyy-MM-dd");
      
      const menuRes = await fetch(`/api/student/weekly-menu?startDate=${todayStr}&endDate=${endDateStr}`);
      if (!menuRes.ok) throw new Error("Failed to fetch menus");
      const menuData = await menuRes.json();
      
      setSlots(menuData.slots || []);
      setMenus(menuData.menus || []);
      
      // Fetch selections for the same window
      const selRes = await fetch(`/api/student/selections?startDate=${todayStr}&endDate=${endDateStr}`);
      if (!selRes.ok) throw new Error("Failed to fetch selections");
      const selData = await selRes.json();
      setSelections(selData.selections?.map((s: any) => s.weekly_menu_id || s.meal_id) || []);
      
    } catch (err) {
      toast.error("Failed to load meal data");
    } finally {
      setIsLoading(false);
    }
  };

  const getMenuForCell = (dateStr: string, slotName: string) => {
    return menus.find(m => m.date === dateStr && m.meal_slot === slotName);
  };

  const isSelected = (menuId: string) => selections.includes(menuId);

  const isLocked = (dateStr: string) => {
    const targetDate = startOfDay(parseISO(dateStr));
    const today = startOfDay(currentDate);
    
    // Past dates are locked
    if (isBefore(targetDate, today)) return true;
    
    // For today, after 10 AM (adjust cutoff as per previous rules, simple mock here)
    if (isSameDay(targetDate, today)) {
       const dhakaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
       if (dhakaTime.getHours() >= 10) return true;
    }
    
    return false;
  };

  const handleToggle = async (menu: MenuEntry) => {
    const isCurrentlySelected = isSelected(menu.id);
    const dateStr = menu.date;
    
    if (isLocked(dateStr)) return;
    
    const cellKey = `${menu.id}`;
    if (togglingCells.has(cellKey)) return;
    
    // Optimistic UI updates
    setTogglingCells(prev => new Set(prev).add(cellKey));
    setSelections(prev => isCurrentlySelected 
      ? prev.filter(id => id !== menu.id) 
      : [...prev, menu.id]
    );

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
      setSelections(prev => isCurrentlySelected 
        ? [...prev, menu.id] 
        : prev.filter(id => id !== menu.id)
      );
    } finally {
      setTogglingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const calculateTotalCost = () => {
    return menus
      .filter(m => selections.includes(m.id))
      .reduce((sum, m) => sum + (m.price || 0), 0);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A2A]">Meal Selection</h1>
          <p className="text-sm text-gray-500">Choose your meals for the upcoming week</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-[#E4E2DA]">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 flex-1 sm:flex-none py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md transition-colors ${
              activeTab === "today" ? "bg-[#1A3A2A] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab("week")}
            className={`px-4 flex-1 sm:flex-none py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md transition-colors ${
              activeTab === "week" ? "bg-[#1A3A2A] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Rolling 7 Days
          </button>
        </div>
      </div>

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
                const dayDate = addDays(currentDate, i);
                const dateStr = format(dayDate, "yyyy-MM-dd");
                const isToday = i === 0;
                
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
      
      <div className="bg-white p-4 rounded-xl border border-[#E4E2DA] shadow-sm flex justify-between items-center text-[#1A3A2A]">
        <div className="font-medium">Total Estimated Cost (Selected Window):</div>
        <div className="text-xl font-bold bg-[#E8F5E9] text-green-800 px-3 py-1 rounded-lg">
          ৳ {calculateTotalCost()}
        </div>
      </div>
    </div>
  );
}
