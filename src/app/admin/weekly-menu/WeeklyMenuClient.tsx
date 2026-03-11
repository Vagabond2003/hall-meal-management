"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, startOfWeek, isSameDay, startOfDay } from "date-fns";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Copy, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type WeeklyMenu = {
  id: string;
  week_start_date: string;
  day_of_week: number;
  meal_slot: string;
  items: string;
  price: number;
  is_active: boolean;
};

export default function WeeklyMenuClient() {
  // Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Ensure week always starts on Sunday
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  
  // Data State
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{day: number; slot: string} | null>(null);
  const [editForm, setEditForm] = useState({ items: "", price: "", slotName: "" });

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyToDate, setCopyToDate] = useState("");

  const [clearModalOpen, setClearModalOpen] = useState(false);

  // Data Fetching
  const fetchWeekMenus = async (start: Date) => {
    setLoading(true);
    try {
      const startStr = format(start, "yyyy-MM-dd");
      const res = await fetch(`/api/admin/weekly-menu?weekStart=${startStr}`);
      const data = await res.json();
      if (res.ok) {
        setMenus(data.menus || []);
      } else {
        toast.error("Failed to fetch menu");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekMenus(weekStart);
  }, [weekStart]);

  // Actions
  const handlePrevWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handleThisWeek = () => setCurrentDate(new Date());

  const openEditModal = (day: number, slotName: string, existingMenu?: WeeklyMenu) => {
    setActiveSlot({ day, slot: slotName });
    if (existingMenu) {
      setEditForm({ items: existingMenu.items, price: existingMenu.price.toString(), slotName: existingMenu.meal_slot });
    } else {
      setEditForm({ items: "", price: "0", slotName: slotName });
    }
    setEditModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot) return;

    try {
      const res = await fetch("/api/admin/weekly-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start_date: format(weekStart, "yyyy-MM-dd"),
          day_of_week: activeSlot.day,
          meal_slot: editForm.slotName,
          items: editForm.items,
          price: parseFloat(editForm.price),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Meal slot saved!");
      setEditModalOpen(false);
      fetchWeekMenus(weekStart);
    } catch (err) {
      toast.error("Error saving meal slot");
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu slot?")) return;
    try {
      const res = await fetch(`/api/admin/weekly-menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Meal slot deleted");
      fetchWeekMenus(weekStart);
    } catch (err) {
      toast.error("Error deleting meal slot");
    }
  };

  const handleCopyWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyToDate) return;

    const targetWeekStart = startOfWeek(new Date(copyToDate), { weekStartsOn: 0 });
    
    try {
      const res = await fetch("/api/admin/weekly-menu/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWeekStart: format(weekStart, "yyyy-MM-dd"),
          toWeekStart: format(targetWeekStart, "yyyy-MM-dd"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(`Copied ${data.count} items to the selected week.`);
      setCopyModalOpen(false);
    } catch (err) {
      toast.error("Error copying week");
    }
  };

  const handleClearWeek = async () => {
    try {
      // Loop over current rendered menus and delete them all via the single endpoint
      // We could ideally build a bulk delete endpoint, but we can map standard delete since it's only up to 21 rows
      await Promise.all(menus.map(m => fetch(`/api/admin/weekly-menu/${m.id}`, { method: "DELETE" })));
      toast.success("Week cleared");
      setClearModalOpen(false);
      fetchWeekMenus(weekStart);
    } catch (err) {
      toast.error("Error clearing week");
    }
  };

  // Rendering Helpers
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStart, i);
    return {
      index: i,
      dateObj: d,
      name: format(d, "EEEE"),
      dateStr: format(d, "MMM d"),
      isToday: isSameDay(d, new Date()),
      isPast: d < startOfDay(new Date()) && !isSameDay(d, new Date())
    };
  });

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">Weekly Menu Planner</h1>
          <p className="text-slate-500 dark:text-slate-400">Set the menu for each day and meal slot</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setClearModalOpen(true)} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Clear Week
          </Button>
          <Button onClick={() => setCopyModalOpen(true)} className="gap-2 shadow-btn-hover btn-hover">
            <Copy className="w-4 h-4" /> Copy This Week
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-surface rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-border">
        <Button variant="outline" size="icon" onClick={handlePrevWeek} className="rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col items-center">
          <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            Week of {format(weekStart, "MMMM d")} – {format(weekEnd, "MMMM d, yyyy")}
          </span>
          <button onClick={handleThisWeek} className="text-sm font-medium text-primary hover:underline mt-1">
            This Week
          </button>
        </div>

        <Button variant="outline" size="icon" onClick={handleNextWeek} className="rounded-xl">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <LoadingSkeleton className="h-12 w-full rounded-xl" />
              <LoadingSkeleton className="h-32 w-full rounded-2xl" />
              <LoadingSkeleton className="h-32 w-full rounded-2xl" />
              <LoadingSkeleton className="h-32 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        /* Grid */
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-start"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
        >
          {days.map((day) => {
            const dayMenus = menus.filter(m => m.day_of_week === day.index);
            const breakfast = dayMenus.find(m => m.meal_slot.toLowerCase() === "breakfast");
            const lunch = dayMenus.find(m => m.meal_slot.toLowerCase() === "lunch");
            const dinner = dayMenus.find(m => m.meal_slot.toLowerCase() === "dinner");
            const extras = dayMenus.filter(m => !["breakfast", "lunch", "dinner"].includes(m.meal_slot.toLowerCase()));

            return (
              <motion.div 
                key={day.index} 
                className="flex flex-col gap-3 relative"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              >
                {/* Column Header */}
                <div className={`p-3 text-center rounded-xl border-b-4 transition-colors ${day.isToday ? 'bg-primary/5 dark:bg-primary/20 border-primary' : day.isPast ? 'bg-slate-50 dark:bg-[#182218] border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-surface border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                  <h3 className="font-heading font-bold text-slate-800 dark:text-slate-200">{day.name}</h3>
                  <p className="text-sm font-medium text-slate-500">{day.dateStr}</p>
                </div>

                {/* SLOTS */}
                {[
                  { name: "Breakfast", menu: breakfast },
                  { name: "Lunch", menu: lunch },
                  { name: "Dinner", menu: dinner },
                  ...extras.map(e => ({ name: e.meal_slot, menu: e }))
                ].map((slot, idx) => (
                  <div key={idx} className={`relative flex flex-col p-4 rounded-2xl bg-white dark:bg-surface border transition-all ${slot.menu ? 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md' : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-surface/50'}`}>
                    
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white">{slot.name}</h4>
                      {slot.menu ? (
                        <div className="flex gap-1">
                          <button onClick={() => openEditModal(day.index, slot.name, slot.menu)} className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteMenu(slot.menu!.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {slot.menu ? (
                      <>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 whitespace-pre-wrap flex-1">{slot.menu.items}</p>
                        <div className="font-heading font-semibold text-lg text-primary">
                          ৳{slot.menu.price.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <button onClick={() => openEditModal(day.index, slot.name)} className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" /> Add Menu
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={() => openEditModal(day.index, "")} className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-primary uppercase tracking-wider rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors bg-white/50 dark:bg-surface/50 mt-1">
                  + Add Extra Slot
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeSlot?.slot ? `Edit ${activeSlot.slot}` : "Add Extra Meal Slot"} 
              <span className="text-slate-400 font-normal ml-2">
                ({activeSlot ? format(addDays(weekStart, activeSlot.day), "EEEE") : ""})
              </span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMenu} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Slot Name</label>
              <Input 
                value={editForm.slotName} 
                onChange={(e) => setEditForm(prev => ({...prev, slotName: e.target.value}))} 
                required 
                placeholder="e.g. Breakfast, Evening Snack"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Menu Items (comma separated)</label>
              <textarea 
                className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={editForm.items}
                onChange={(e) => setEditForm(prev => ({...prev, items: e.target.value}))}
                required
                placeholder="Rice, Dal, Chicken"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Price (৳)</label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                value={editForm.price} 
                onChange={(e) => setEditForm(prev => ({...prev, price: e.target.value}))} 
                required 
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Menu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Copy Modal */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Copy Weekly Menu</DialogTitle>
            <DialogDescription>
              Copy all items from this week to another week. Existing items in the target week will not be overwritten.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCopyWeek} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Select Target Date (Any day in target week)</label>
              <Input 
                type="date"
                value={copyToDate} 
                onChange={(e) => setCopyToDate(e.target.value)} 
                required 
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCopyModalOpen(false)}>Cancel</Button>
              <Button type="submit">Copy Data</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear Modal */}
      <Dialog open={clearModalOpen} onOpenChange={setClearModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Clear Entire Week
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL menu entries for the week of {format(weekStart, "MMMM d")}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setClearModalOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleClearWeek}>Yes, Clear Week</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
