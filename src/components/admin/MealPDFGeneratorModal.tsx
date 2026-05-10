"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  FileDown,
  Sunrise,
  Sun,
  Moon,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { generateMealReport } from "@/lib/pdf/generateMealReport";

type MealType = "breakfast" | "lunch" | "dinner";

interface MealPDFGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mealConfig: Record<
  MealType,
  { label: string; icon: React.ReactNode; bg: string; border: string; text: string; ring: string }
> = {
  breakfast: {
    label: "Breakfast",
    icon: <Sunrise className="w-4 h-4" />,
    bg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
    ring: "ring-amber-400",
  },
  lunch: {
    label: "Lunch",
    icon: <Sun className="w-4 h-4" />,
    bg: "bg-sky-100",
    border: "border-sky-300",
    text: "text-sky-800",
    ring: "ring-sky-400",
  },
  dinner: {
    label: "Dinner",
    icon: <Moon className="w-4 h-4" />,
    bg: "bg-indigo-100",
    border: "border-indigo-300",
    text: "text-indigo-800",
    ring: "ring-indigo-400",
  },
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MealPDFGeneratorModal({
  isOpen,
  onClose,
}: MealPDFGeneratorModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [isGenerating, setIsGenerating] = useState(false);
  const [emptyState, setEmptyState] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetStates = useCallback(() => {
    setEmptyState(false);
    setErrorMsg(null);
    setSuccess(false);
  }, []);

  const handleGenerate = useCallback(
    async (date: string, meal: MealType) => {
      resetStates();
      setIsGenerating(true);
      try {
        const res = await fetch(
          `/api/admin/reports/daily-meal?date=${encodeURIComponent(date)}&meal=${meal}`
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to fetch report data");
        }
        const data = await res.json();
        if (data.students.length === 0) {
          setEmptyState(true);
          return;
        }
        generateMealReport(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong");
      } finally {
        setIsGenerating(false);
      }
    },
    [resetStates]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-gray-700" />
                <h2 className="text-base font-semibold text-gray-900">
                  Generate Meal Report
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-5">
              {/* Date selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Date
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        resetStates();
                      }}
                      max={todayStr}
                      min="2024-01-01"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDate(todayStr);
                      resetStates();
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSelectedDate(yesterday.toISOString().split("T")[0]);
                      resetStates();
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              {/* Meal type selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Meal Type
                </label>
                <div className="flex gap-2">
                  {(Object.keys(mealConfig) as MealType[]).map((meal) => {
                    const cfg = mealConfig[meal];
                    const isActive = selectedMeal === meal;
                    return (
                      <button
                        key={meal}
                        onClick={() => {
                          setSelectedMeal(meal);
                          resetStates();
                        }}
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          isActive
                            ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-1 ${cfg.ring}`
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Quick Actions — Today&apos;s Reports
                </p>
                <div className="flex gap-2">
                  {(Object.keys(mealConfig) as MealType[]).map((meal) => {
                    const cfg = mealConfig[meal];
                    return (
                      <button
                        key={meal}
                        onClick={() => {
                          setSelectedDate(todayStr);
                          setSelectedMeal(meal);
                          handleGenerate(todayStr, meal);
                        }}
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium border transition-all",
                          "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                          isGenerating && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {cfg.icon}
                        <span>{cfg.label} PDF</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alerts */}
              {emptyState && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    No students activated{" "}
                    <span className="font-medium">
                      {mealConfig[selectedMeal].label}
                    </span>{" "}
                    on{" "}
                    <span className="font-medium">
                      {formatDisplayDate(selectedDate)}
                    </span>
                    .
                  </p>
                </div>
              )}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-800 font-medium">
                    PDF downloaded successfully
                  </p>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={() => handleGenerate(selectedDate, selectedMeal)}
                disabled={isGenerating}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isGenerating
                    ? "bg-emerald-700 text-white cursor-wait"
                    : "bg-emerald-800 text-white hover:bg-emerald-900 active:scale-[0.98]"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Generate &amp; Download PDF
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
