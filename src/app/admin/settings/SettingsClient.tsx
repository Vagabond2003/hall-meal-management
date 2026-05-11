"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function SettingsClient() {
  const [deadline, setDeadline] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      
      if (data.settings) {
        setDeadline(data.settings.meal_selection_deadline || "");
        setSecretCode(data.settings.admin_secret_code || "");
      }
    } catch (error) {
      toast.error("Could not load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) return toast.error("Please enter a valid time");

    try {
      setSavingDeadline(true);
      const res = await fetch(`/api/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_selection_deadline: deadline })
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      if (data.settings?.meal_selection_deadline !== undefined) {
        setDeadline(data.settings.meal_selection_deadline);
      }
      toast.success("Meal selection deadline updated");
    } catch (err) {
      toast.error("Failed to update deadline");
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode || secretCode.length < 6) {
      return toast.error("Secret code must be at least 6 characters");
    }

    try {
      setSavingSecret(true);
      const res = await fetch(`/api/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_secret_code: secretCode })
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      if (data.settings?.admin_secret_code !== undefined) {
        setSecretCode(data.settings.admin_secret_code);
      }
      toast.success("Admin secret code updated");
    } catch (err) {
      toast.error("Failed to update secret code");
    } finally {
      setSavingSecret(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-[220px] w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <motion.div 
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage global application configurations and security.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deadline Settings Card */}
        <motion.div 
          className="bg-white dark:bg-[#182218] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#2A3A2B] flex flex-col h-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meal Selection Deadline</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Daily cutoff time for students to select meals.</p>
            </div>
          </div>

          <form onSubmit={handleSaveDeadline} className="flex flex-col flex-grow">
            <div className="mb-6">
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cutoff Time
              </label>
              <input
                id="deadline"
                type="time"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-[#1F2B20] dark:border-[#2A3A2B] dark:text-white text-lg font-medium tracking-wider dark:[color-scheme:dark]"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex gap-2 items-start">
                <span className="text-amber-600 dark:text-amber-500 font-bold">*</span>
                After this time, students cannot change their selections for today. Selections will carry over automatically.
              </p>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#2A3A2B]">
              <button
                type="submit"
                disabled={savingDeadline}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white transition-all hover:bg-primary-light disabled:opacity-70 ml-auto"
              >
                {savingDeadline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Deadline
              </button>
            </div>
          </form>
        </motion.div>

        {/* Admin Secret Code Card */}
        <motion.div 
          className="bg-white dark:bg-[#182218] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#2A3A2B] flex flex-col h-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin Secret Code</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Authorization code needed for new admins.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSecret} className="flex flex-col flex-grow">
            <div className="mb-6">
              <label htmlFor="secretCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Secret Passcode
              </label>
              <div className="relative">
                <input
                  id="secretCode"
                  type={showSecret ? "text" : "password"}
                  required
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter secret code..."
                  className="w-full pl-4 pr-20 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-[#1F2B20] dark:border-[#2A3A2B] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-2 px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-[#182218] border border-slate-200 dark:border-[#2A3A2B] rounded-md transition-colors"
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex gap-2 items-start">
                <span className="text-amber-600 dark:text-amber-500 font-bold">*</span>
                Do not share this code publicly. Anyone with this code can register as a full administrator.
              </p>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#2A3A2B]">
              <button
                type="submit"
                disabled={savingSecret}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white transition-all hover:bg-primary-light disabled:opacity-70 ml-auto"
              >
                {savingSecret ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Code
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
