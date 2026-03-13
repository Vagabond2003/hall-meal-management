"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MealSelectionClient from "./MealSelectionClient";
import WeeklySelectionClient from "./WeeklySelectionClient";

interface MenuProp {
  id: string;
  meal_slot: string;
  items: string;
  price: string | number;
}

interface Props {
  dailyMenus: MenuProp[];
  dailySelectedIds: string[];
  todayStr: string;
}

export default function MealSelectionWrapper({ dailyMenus, dailySelectedIds, todayStr }: Props) {
  const [view, setView] = useState<"daily" | "weekly">("daily");

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="relative flex items-center p-1 bg-white dark:bg-[#182218] rounded-full border border-slate-200 dark:border-[#2A3A2B] shadow-sm">
          <button
            onClick={() => setView("daily")}
            className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full tracking-wide transition-colors ${
              view === "daily" ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`relative z-10 px-6 py-2 text-sm font-medium rounded-full tracking-wide transition-colors ${
              view === "weekly" ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            This Week
          </button>

          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full shadow-md z-0"
            initial={false}
            animate={{
              x: view === "daily" ? 4 : "calc(100% + 4px)",
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
        </div>
      </div>

      {view === "daily" ? (
        <MealSelectionClient 
          menus={dailyMenus} 
          initialSelectedIds={dailySelectedIds} 
          todayStr={todayStr} 
        />
      ) : (
        <WeeklySelectionClient />
      )}
    </div>
  );
}
