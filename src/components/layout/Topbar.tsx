"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, UserCircle, LogOut, Settings, Utensils, UserPlus, Loader2, Menu, MessageSquare } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

export function Topbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const [showBell, setShowBell] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [feedbackNotifs, setFeedbackNotifs] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const isAdmin = pathname?.startsWith("/admin");
  const isStudent = pathname?.startsWith("/student");

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowBell(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUser(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch activities when bell is opened for the first time (admin only)
  useEffect(() => {
    if (showBell && activities.length === 0 && isAdmin) {
      setIsLoadingActivities(true);
      Promise.all([
        fetch('/api/admin/activities').then(r => r.json()),
        fetch('/api/admin/feedback-notifications').then(r => r.json()),
      ]).then(([actData, fbData]) => {
        if (actData.activities) setActivities(actData.activities);
        if (fbData.notifications) setFeedbackNotifs(fbData.notifications);
      }).finally(() => setIsLoadingActivities(false));
    }
  }, [showBell, activities.length, isAdmin]);

  // Format current date e.g. "Mon, Oct 24, 2024"
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const displayName = session?.user?.name || (isStudent ? "Student" : "User");
  const displayRole = session?.user?.role || (isStudent ? "student" : isAdmin ? "admin" : "user");

  return (
    <header className="h-16 lg:h-20 bg-background/80 backdrop-blur-md sticky top-0 md:top-0 lg:top-0 z-30 border-b border-border px-4 lg:px-6 flex items-center justify-between lg:mt-0 shadow-sm lg:shadow-none">
      <div className="flex items-center gap-3 lg:hidden">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggleMobileMenu'))}
          className="p-2 -ml-2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Utensils className="w-5 h-5 text-accent-gold" />
          <span className="font-heading font-bold text-sm tracking-wide line-clamp-1">OHMM</span>
        </div>
      </div>

      <div className="hidden lg:block">
        <p className="text-text-secondary text-sm font-medium">{currentDate}</p>
        <h2 className="text-xl font-heading font-bold text-text-primary capitalize">
          Welcome back
          {status === "loading" ? "..." : (displayName !== "Student" && displayName !== "User" ? `, ${displayName.split(" ")[0]}` : "")}
        </h2>
      </div>
      
      {/* Fallback for mobile since the greeting is hidden */}
      <h2 className="hidden sm:block lg:hidden text-lg font-heading font-bold text-text-primary capitalize line-clamp-1">
        {isStudent ? "Student Dash" : isAdmin ? "Admin Dash" : "Dashboard"}
      </h2>

      <div className="flex items-center gap-4">
        {/* Bell Dropdown */}
        <div className="relative" ref={bellRef}>
          <button 
            onClick={() => {
              setShowBell(!showBell);
              setShowUser(false);
            }}
            className={`p-2 transition-colors relative rounded-full hover:bg-slate-100 dark:hover:bg-[#1F2B20] ${
              showBell ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-primary'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-warning rounded-full ring-2 ring-background"></span>
          </button>

          <AnimatePresence>
            {showBell && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 rounded-2xl bg-white shadow-xl border border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B] overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 dark:border-[#2A3A2B] flex justify-between items-center bg-slate-50/50 dark:bg-[#182218]">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto w-full custom-scrollbar">
                  {isLoadingActivities ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-[#2A3A2B]">
                      {activities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-[#1F2B20] transition-colors flex gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#2A3A2B]">
                            {activity.type === 'student_joined' ? (
                              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Utensils className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {activity.type === 'student_joined' ? 'New Student' : 'Meal Added'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                              {activity.description}
                            </p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(activity.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No recent activities.
                    </div>
                  )}
                  {feedbackNotifs.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-[#182218] border-t border-slate-100 dark:border-[#2A3A2B]">
                        Recent Feedback
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-[#2A3A2B]">
                        {feedbackNotifs.slice(0, 5).map((n: any) => (
                          <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-[#1F2B20] transition-colors flex gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                              <MessageSquare className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {n.student_name}
                                <span className="font-mono text-xs text-slate-400 ml-1">#{n.token_number}</span>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Rated {n.meal_slot} {Array(n.rating).fill('★').join('')}
                                {n.comment ? ` — "${n.comment.slice(0, 40)}${n.comment.length > 40 ? '...' : ''}"` : ''}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {format(new Date(n.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* User Dropdown */}
        <div className="relative pl-4 border-l border-border" ref={userRef}>
          <button 
            onClick={() => {
              setShowUser(!showUser);
              setShowBell(false);
            }}
            className="flex items-center gap-2 lg:gap-3 w-full text-left focus:outline-none group rounded-full sm:rounded-none sm:hover:opacity-80 transition-opacity"
          >
            {status === "loading" ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold font-heading">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block">
              {status === "loading" ? (
                <>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-primary leading-none capitalize group-hover:text-primary transition-colors">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 tracking-wide uppercase">
                    {displayRole}
                  </p>
                </>
              )}
            </div>
          </button>

          <AnimatePresence>
            {showUser && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white shadow-xl border border-slate-100 dark:bg-[#182218] dark:border-[#2A3A2B] overflow-hidden z-50 py-2"
              >
                <button 
                  onClick={() => {
                    toast.info("Account settings coming soon!");
                    setShowUser(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-[#1F2B20] transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <div className="h-px bg-slate-100 dark:bg-[#2A3A2B] my-1" />
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
