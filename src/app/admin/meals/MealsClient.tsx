"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Utensils, 
  Star, 
  Trash2, 
  Edit3, 
  Loader2, 
  CalendarIcon,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  meal_type: "regular" | "special";
  date: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MealsClient() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet (Add/Edit) State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMealId, setCurrentMealId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    meal_type: "regular" as "regular" | "special",
    date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/meals`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      const data = await res.json();
      setMeals(data.meals);
    } catch (error) {
      toast.error("Could not load meals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const openAddSheet = () => {
    setIsEditing(false);
    setCurrentMealId(null);
    setFormData({ name: "", description: "", price: "", meal_type: "regular", date: "" });
    setIsSheetOpen(true);
  };

  const openEditSheet = (meal: Meal) => {
    setIsEditing(true);
    setCurrentMealId(meal.id);
    setFormData({
      name: meal.name,
      description: meal.description || "",
      price: meal.price.toString(),
      meal_type: meal.meal_type,
      date: meal.date ? new Date(meal.date).toISOString().split('T')[0] : ""
    });
    setIsSheetOpen(true);
  };

  const confirmDelete = (meal: Meal) => {
    setMealToDelete(meal);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (mealId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/meals/${mealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (!res.ok) throw new Error("Update failed");
      
      toast.success(currentStatus ? "Meal deactivated" : "Meal activated");
      setMeals(prev => prev.map(m => m.id === mealId ? { ...m, is_active: !currentStatus } : m));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || (formData.meal_type === 'special' && !formData.date)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        date: formData.meal_type === 'special' ? formData.date : null
      };

      const url = isEditing ? `/api/admin/meals/${currentMealId}` : `/api/admin/meals`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed");

      toast.success(isEditing ? "Meal updated successfully" : "Meal created successfully");
      setIsSheetOpen(false);
      fetchMeals();
    } catch (err: any) {
      toast.error(err.message || "Failed to save meal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/meals/${mealToDelete.id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      toast.success("Meal deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchMeals();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <motion.div 
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <div>
          <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">Meal Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Add, edit, and organize hall meals.</p>
        </div>
        
        <button 
          onClick={openAddSheet}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-medium text-white transition-all hover:bg-primary-light hover:shadow-md dark:bg-primary sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add New Meal
        </button>
      </motion.div>

      {/* Grid of Meals */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <LoadingSkeleton key={i} className="h-[260px] w-full" />)}
        </div>
      ) : meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {meals.map((meal, i) => (
              <motion.div
                key={meal.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-3xl p-8 shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 ${
                  meal.meal_type === 'special' 
                    ? 'bg-gradient-to-br from-[#FDF3E3] to-white border-amber-200 dark:from-amber-900/10 dark:to-[#182218] dark:border-amber-900/30' 
                    : 'bg-white border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B]'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col items-start gap-2">
                    {meal.meal_type === 'special' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                        <Star className="h-3 w-3 fill-white" /> Special Meal
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-[#1F2B20] dark:text-slate-300 border border-slate-200 dark:border-[#2A3A2B]">
                        Regular Option
                      </span>
                    )}
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white leading-tight">
                      {meal.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary dark:text-primary-muted">
                      ৳{meal.price}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">/ day</p>
                  </div>
                </div>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-8 flex-grow leading-relaxed">
                  {meal.description || "No description provided."}
                </p>

                {meal.meal_type === 'special' && meal.date && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg mb-4 w-fit">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(meal.date), "EEEE, MMM d")}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-[#2A3A2B] pt-4 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </span>
                    <button
                      onClick={() => handleToggleStatus(meal.id, meal.is_active)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        meal.is_active ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={meal.is_active}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          meal.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ml-1 ${meal.is_active ? 'text-green-700 dark:text-green-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {meal.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditSheet(meal)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors dark:hover:bg-[#1F2B20]"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => confirmDelete(meal)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-[#182218] border border-slate-100 dark:border-[#2A3A2B] rounded-2xl border-dashed">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Utensils className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Meals Created</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">Create the standard regular meals (Breakfast, Lunch, Dinner) or upcoming special feasts to get started.</p>
          <button 
            onClick={openAddSheet}
            className="flex items-center gap-2 rounded-lg bg-primary py-2 px-4 text-sm font-medium text-white transition-all hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" /> Add First Meal
          </button>
        </div>
      )}

      {/* Add / Edit Meal Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-[540px] px-8 py-10 overflow-y-auto custom-scrollbar border-l border-slate-200 dark:border-[#2A3A2B] bg-white dark:bg-[#0F1612]">
          <SheetHeader className="mb-8">
            <SheetTitle className="font-heading text-2xl dark:text-white">
              {isEditing ? 'Edit Meal' : 'Add New Meal'}
            </SheetTitle>
            <SheetDescription className="dark:text-slate-400">
              {isEditing 
                ? 'Update the details and pricing for this meal.' 
                : 'Create a new regular daily meal or a one-off special feast.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveMeal} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Meal Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, meal_type: 'regular', date: "" })}
                  className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all ${
                    formData.meal_type === 'regular' 
                      ? 'border-primary bg-primary/5 text-primary shadow-sm dark:border-primary-muted dark:bg-primary/20 dark:text-primary-muted' 
                      : 'border-slate-100 hover:border-primary/30 text-slate-500 dark:border-[#2A3A2B] dark:text-slate-400'
                  }`}
                >
                  <Utensils className={`h-8 w-8 mb-3 ${formData.meal_type === 'regular' ? 'text-primary dark:text-primary-muted' : ''}`} />
                  <span className="font-semibold text-base">Regular</span>
                  <span className="text-xs text-center opacity-70 mt-1.5">Available every day</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, meal_type: 'special' })}
                  className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all ${
                    formData.meal_type === 'special' 
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-400' 
                      : 'border-slate-100 hover:border-amber-500/30 text-slate-500 dark:border-[#2A3A2B] dark:text-slate-400'
                  }`}
                >
                  <Star className={`h-8 w-8 mb-3 ${formData.meal_type === 'special' ? 'text-amber-500 fill-amber-500' : ''}`} />
                  <span className="font-semibold text-base">Special Feast</span>
                  <span className="text-xs text-center opacity-70 mt-1.5">Specific date only</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Meal Name</label>
              <input
                id="name"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Lunch, Grand Eid Feast"
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-0 focus:border-primary transition-colors dark:bg-[#182218] dark:border-[#2A3A2B] dark:text-white text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Price (৳)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-medium">৳</span>
                <input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-0 focus:border-primary transition-colors dark:bg-[#182218] dark:border-[#2A3A2B] dark:text-white text-base font-semibold"
                />
              </div>
            </div>

            <AnimatePresence>
              {formData.meal_type === 'special' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label htmlFor="date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-0 focus:border-primary transition-colors dark:bg-[#182218] dark:border-[#2A3A2B] dark:text-white dark:[color-scheme:dark] text-base"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label htmlFor="desc" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Included Items (Optional)</label>
              <textarea
                id="desc"
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Rice, Beef Curry, Daal, Salad"
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-0 focus:border-primary transition-colors resize-none dark:bg-[#182218] dark:border-[#2A3A2B] dark:text-white text-base"
              />
            </div>

            <SheetFooter className="mt-10 mb-8 sm:mb-0">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl bg-primary text-white font-semibold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-primary-light transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isEditing ? 'Update Meal' : 'Create Meal'}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#182218] border-slate-100 dark:border-[#2A3A2B]">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500 font-heading">Delete Meal</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{mealToDelete?.name}</strong>? 
              This action cannot be undone. If students have historical records for this meal, the deletion will fail. You should disable it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm dark:border-[#2A3A2B] dark:text-slate-300 dark:hover:bg-[#1F2B20]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteMeal}
              disabled={isSubmitting}
              className="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium text-sm disabled:opacity-70 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
