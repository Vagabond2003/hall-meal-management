"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks, parseISO, isBefore, startOfDay } from "date-fns";
import { Loader2, Plus, ChevronLeft, ChevronRight, Settings, Copy, Lock, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import FeedbackModal from "@/components/FeedbackModal";

type MealSlot = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
};

type MenuEntry = {
  id: string;
  week_start_date: string;
  day_of_week: number;
  meal_slot: string;
  items: string;
  price: number;
};

// Helper to compute ordinal week label
function getWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const majorityDate = addDays(weekStart, 3); // Thursday marks the majority month of a 7-day week
  const majorityMonth = majorityDate.getMonth();
  const majorityYear = majorityDate.getFullYear();
  
  const firstOfMonth = new Date(majorityYear, majorityMonth, 1);
  const firstWeekStart = startOfWeek(firstOfMonth, { weekStartsOn: 0 });
  
  // Calculate difference in weeks
  const diffTime = weekStart.getTime() - firstWeekStart.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
  const weekNumber = diffWeeks + 1;
  
  let suffix = "th";
  if (weekNumber % 10 === 1 && weekNumber % 100 !== 11) suffix = "st";
  else if (weekNumber % 10 === 2 && weekNumber % 100 !== 12) suffix = "nd";
  else if (weekNumber % 10 === 3 && weekNumber % 100 !== 13) suffix = "rd";
  
  const monthName = format(majorityDate, "MMMM");
  const startStr = format(weekStart, "MMM d");
  const endStr = format(weekEnd, "MMM d");
  
  return `${weekNumber}${suffix} Week of ${monthName} (${startStr} \u2013 ${endStr})`;
}

export default function WeeklyMenuClient() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [feedbackModal, setFeedbackModal] = useState<{
    weeklyMenuId: string;
    date: string;
    mealName: string;
    mealItems: string;
  } | null>(null);
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManageSlots, setShowManageSlots] = useState(false);
  
  const [clipboardWeekStart, setClipboardWeekStart] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const weekStartStr = format(currentDate, "yyyy-MM-dd");

  const [editingCell, setEditingCell] = useState<{
    dayOfWeek: number;
    slotName: string;
  } | null>(null);

  const [editForm, setEditForm] = useState({ items: "", price: 0 });
  const [isSavingCell, setIsSavingCell] = useState(false);

  useEffect(() => {
    fetchData();
  }, [weekStartStr]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/weekly-menu?weekStart=${weekStartStr}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSlots(data.slots || []);
      setMenus(data.menus || []);
    } catch (err) {
      toast.error("Failed to load weekly menu data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextWeek = () => setCurrentDate((prev) => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate((prev) => subWeeks(prev, 1));
  const handleThisWeek = () => setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const activeSlots = slots.filter(s => s.is_active).sort((a, b) => a.display_order - b.display_order);

  const getMenuForCell = (dayOfWeek: number, slotName: string) => {
    return menus.find(m => m.day_of_week === dayOfWeek && m.meal_slot === slotName);
  };

  const handleEditClick = (dayOfWeek: number, slotName: string, existingMenu?: MenuEntry) => {
    setEditingCell({ dayOfWeek, slotName });
    if (existingMenu) {
      setEditForm({ items: existingMenu.items, price: existingMenu.price || 0 });
    } else {
      setEditForm({ items: "", price: 0 });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditForm({ items: "", price: 0 });
  };

  const handleSaveCell = async (dayOfWeek: number, slotName: string, existingMenuId?: string) => {
    setIsSavingCell(true);
    try {
      if (!editForm.items.trim()) {
        if (existingMenuId) {
          // Delete if making empty
          const res = await fetch(`/api/admin/weekly-menu/${existingMenuId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");
          setMenus(menus.filter(m => m.id !== existingMenuId));
        }
      } else {
        if (existingMenuId) {
          // Update
          const res = await fetch(`/api/admin/weekly-menu/${existingMenuId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: editForm.items, price: Number(editForm.price) }),
          });
          if (!res.ok) throw new Error("Failed to update");
          const { menu } = await res.json();
          setMenus(menus.map(m => m.id === existingMenuId ? menu : m));
        } else {
          // Create
          const res = await fetch(`/api/admin/weekly-menu`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              week_start_date: weekStartStr,
              day_of_week: dayOfWeek,
              meal_slot: slotName,
              items: editForm.items,
              price: Number(editForm.price),
            }),
          });
          if (!res.ok) throw new Error("Failed to create");
          const { menu } = await res.json();
          setMenus([...menus, menu]);
        }
      }
      toast.success("Saved");
      handleCancelEdit();
    } catch (err) {
      toast.error("Failed to save meal");
    } finally {
      setIsSavingCell(false);
    }
  };

  const handleCopyWeek = () => {
    setClipboardWeekStart(weekStartStr);
    setIsCopying(true);
    toast.success("Week copied!");
    setTimeout(() => {
      setIsCopying(false);
    }, 2000);
  };

  const handlePasteWeek = async () => {
    if (!clipboardWeekStart) return;
    if (clipboardWeekStart === weekStartStr) {
      toast.error("Cannot paste a week into itself");
      return;
    }
    
    const sourceLabel = getWeekLabel(parseISO(clipboardWeekStart));
    const targetLabel = getWeekLabel(currentDate);
    
    if (!confirm(`Paste menu from ${sourceLabel} into ${targetLabel}? Existing menus in this week will be overwritten.`)) return;
    
    setIsPasting(true);
    try {
      const res = await fetch('/api/admin/weekly-menu/copy', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWeekStart: clipboardWeekStart,
          targetWeekStart: weekStartStr
        }),
      });
      if (!res.ok) throw new Error("Failed to copy");
      toast.success("Week pasted successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to paste week");
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A2A]">Weekly Menu</h1>
          <p className="text-sm text-gray-500">Set meals for each day and slot</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageSlots(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E4E2DA] rounded-lg text-sm text-[#1A3A2A] hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Manage Slots
          </button>
          
          {clipboardWeekStart && (
            <button
              onClick={handlePasteWeek}
              disabled={isPasting}
              className="flex items-center gap-2 px-3 py-2 bg-[#1A3A2A] text-[#C4873A] rounded-lg text-sm hover:bg-[#2A4A3A] transition-colors disabled:opacity-50"
            >
              {isPasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Paste Week
            </button>
          )}

          <button
            onClick={handleCopyWeek}
            disabled={isCopying}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E4E2DA] rounded-lg text-sm text-[#1A3A2A] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            {isCopying ? "Copied \u2713" : "Copy Week"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E4E2DA] shadow-sm">
        <button
          onClick={handlePrevWeek}
          className="p-2 border border-[#E4E2DA] rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          title="Previous Week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-semibold text-[#1A3A2A]">
            {getWeekLabel(currentDate)}
          </span>
          {weekStartStr === format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd") && (
            <span className="text-xs bg-[#1A3A2A]/10 text-[#1A3A2A] px-2 py-0.5 rounded-full mt-1 font-medium">
              This Week
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {weekStartStr !== format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd") && (
            <button
              onClick={handleThisWeek}
              className="text-sm px-3 py-1.5 font-medium text-[#1A3A2A] hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-[#E4E2DA]"
            >
              Today
            </button>
          )}
          <button
            onClick={handleNextWeek}
            className="p-2 border border-[#E4E2DA] rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A3A2A]" />
        </div>
      ) : activeSlots.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-[#E4E2DA] text-center">
          <Info className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-[#1A3A2A]">No Meal Slots Found</h3>
          <p className="text-gray-500 text-sm mt-1 mb-4">You need to set up active meal slots (e.g., Breakfast, Lunch, Dinner) first.</p>
          <button
            onClick={() => setShowManageSlots(true)}
            className="px-4 py-2 bg-[#1A3A2A] text-white rounded-lg hover:bg-[#2A4A3A] transition-colors"
          >
            Manage Slots
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E4E2DA] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#1A3A2A]">
                  <th className="py-3 px-4 font-medium text-[#C4873A] text-xs uppercase tracking-wider border-b border-r border-[#153022] sticky left-0 z-10 bg-[#1A3A2A] shadow-[2px_0_5px_rgba(0,0,0,0.1)] w-[120px]">
                    Day
                  </th>
                  {activeSlots.map(slot => (
                    <th key={slot.id} className="py-3 px-4 font-medium text-[#C4873A] text-xs uppercase tracking-wider border-b border-r border-[#153022] last:border-r-0 min-w-[200px]">
                      {slot.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E2DA]">
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayDate = addDays(currentDate, i);
                  return (
                    <tr key={i} className="hover:bg-gray-50 group">
                      <td className="py-3 px-4 border-r border-[#E4E2DA] sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-top">
                        <div className="font-medium text-[#1A3A2A]">{format(dayDate, "EEEE")}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{format(dayDate, "MMM d")}</div>
                      </td>
                      {activeSlots.map(slot => {
                        const menu = getMenuForCell(i, slot.name);
                        const isEditing = editingCell?.dayOfWeek === i && editingCell?.slotName === slot.name;
                        
                        return (
                          <td key={slot.id} className="py-3 px-4 border-r border-[#E4E2DA] last:border-r-0 align-top relative min-h-[80px]">
                            {isEditing ? (
                              <div className="space-y-3 bg-white p-3 rounded border border-amber-200 shadow-sm relative z-20">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-500">Items (comma separated)</label>
                                  <textarea
                                    value={editForm.items}
                                    onChange={e => setEditForm(prev => ({ ...prev, items: e.target.value }))}
                                    placeholder="e.g. Rice, Chicken, Dal"
                                    className="w-full text-sm border border-[#E4E2DA] rounded p-2 focus:ring-1 focus:ring-[#1A3A2A] focus:border-[#1A3A2A] outline-none resize-none h-16"
                                    autoFocus
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-500">Price (৳)</label>
                                  <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={e => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                    className="w-full text-sm border border-[#E4E2DA] rounded p-2 focus:ring-1 focus:ring-[#1A3A2A] focus:border-[#1A3A2A] outline-none"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isSavingCell}
                                    className="text-xs px-2 py-1.5 text-gray-600 hover:text-gray-900 font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveCell(i, slot.name, menu?.id)}
                                    disabled={isSavingCell}
                                    className="text-xs px-3 py-1.5 bg-[#1A3A2A] text-white rounded font-medium disabled:opacity-50 flex items-center gap-1 hover:bg-[#2A4A3A]"
                                  >
                                    {isSavingCell && <Loader2 className="w-3 h-3 animate-spin"/>}
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : menu ? (
                              <div 
                                className="group/cell flex flex-col h-full cursor-pointer"
                                onClick={() => handleEditClick(i, slot.name, menu)}
                              >
                                <div className="text-sm text-[#1A3A2A] whitespace-pre-wrap flex-grow pr-6">
                                  {menu.items}
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                  <div className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                    ৳ {menu.price}
                                  </div>
                                  <button 
                                    className="opacity-0 group-hover/cell:opacity-100 text-xs px-2 py-1 border border-[#E4E2DA] rounded bg-white text-gray-600 hover:text-[#1A3A2A] hover:bg-gray-50 transition-all font-medium absolute top-3 right-3 shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(i, slot.name, menu);
                                    }}
                                  >
                                    Edit
                                  </button>
                                </div>
                                {isBefore(dayDate, startOfDay(new Date())) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeedbackModal({
                                        weeklyMenuId: menu.id,
                                        date: format(dayDate, 'yyyy-MM-dd'),
                                        mealName: slot.name,
                                        mealItems: menu.items,
                                      });
                                    }}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1A3A2A] transition-colors mt-1"
                                    title="View feedback"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>See Feedback</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center pt-2">
                                <button
                                  onClick={() => handleEditClick(i, slot.name)}
                                  className="text-sm text-gray-400 font-medium italic hover:text-[#1A3A2A] transition-colors flex items-center gap-1 opacity-60 group-hover:opacity-100"
                                >
                                  <Plus className="w-4 h-4" /> Add Menu
                                </button>
                              </div>
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
      )}

      {/* Basic Manage Slots Modal Implementation */}
      {showManageSlots && (
        <ManageSlotsModal 
          isOpen={showManageSlots} 
          onClose={() => {
            setShowManageSlots(false);
            fetchData(); // refresh slots on close
          }} 
        />
      )}

      {feedbackModal && (
        <FeedbackModal
          weeklyMenuId={feedbackModal.weeklyMenuId}
          date={feedbackModal.date}
          mealName={feedbackModal.mealName}
          mealItems={feedbackModal.mealItems}
          onClose={() => setFeedbackModal(null)}
          currentUserId={session?.user?.id ?? ''}
          isAdmin={true}
        />
      )}
    </div>
  );
}

// Subcomponent for Manage Slots
function ManageSlotsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/meal-slots");
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/meal-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) {
        toast.success("Meal slots updated");
        onClose();
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast.error("Failed to update slots");
    } finally {
      setIsSaving(false);
    }
  };

  const addSlot = () => {
    if (!newSlotName.trim()) return;
    const maxOrder = slots.reduce((max, s) => Math.max(max, s.display_order), 0);
    setSlots([...slots, { id: "", name: newSlotName.trim(), display_order: maxOrder + 1, is_active: true }]);
    setNewSlotName("");
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= slots.length) return;
    const newSlots = [...slots];
    const temp = newSlots[index].display_order;
    newSlots[index].display_order = newSlots[index + direction].display_order;
    newSlots[index + direction].display_order = temp;
    newSlots.sort((a, b) => a.display_order - b.display_order);
    setSlots(newSlots);
  };

  const toggleSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index].is_active = !newSlots[index].is_active;
    setSlots(newSlots);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#E4E2DA] flex justify-between items-center bg-[#F7F6F2]">
          <h2 className="text-lg font-bold text-[#1A3A2A]">Manage Meal Slots</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow space-y-4">
          {isLoading ? (
             <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-[#1A3A2A]" /></div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={slot.id || i} className="flex items-center gap-3 p-3 border border-[#E4E2DA] rounded-lg bg-white shadow-sm">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveSlot(i, -1)} 
                      disabled={i === 0}
                      className="text-gray-400 hover:text-[#1A3A2A] disabled:opacity-30"
                      title="Move Up"
                    >▲</button>
                    <button 
                      onClick={() => moveSlot(i, 1)} 
                      disabled={i === slots.length - 1}
                      className="text-gray-400 hover:text-[#1A3A2A] disabled:opacity-30"
                      title="Move Down"
                    >▼</button>
                  </div>
                  
                  <div className="flex-grow font-medium text-[#1A3A2A]">
                    {slot.name}
                  </div>
                  
                  <button
                    onClick={() => toggleSlot(i)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      slot.is_active ? 'bg-[#1A3A2A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        slot.is_active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="New slot name"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  className="flex-grow border border-[#E4E2DA] p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A2A]"
                  onKeyDown={e => e.key === 'Enter' && addSlot()}
                />
                <button
                  onClick={addSlot}
                  disabled={!newSlotName.trim()}
                  className="px-3 py-2 bg-[#1A3A2A] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#E4E2DA] bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E4E2DA] text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-[#1A3A2A] text-[#C4873A] rounded-lg text-sm font-medium hover:bg-[#2A4A3A] flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
