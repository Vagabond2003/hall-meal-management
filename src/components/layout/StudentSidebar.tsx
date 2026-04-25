"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  History, 
  Receipt,
  LogOut,
  Menu,
  X,
  Megaphone
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

const studentNavigation = [
  { name: "Meal Selection", href: "/student/meal-selection", icon: UtensilsCrossed },
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Meal History", href: "/student/history", icon: History },
  { name: "Announcements", href: "/student/announcements", icon: Megaphone },
  { name: "Monthly Bill", href: "/student/billing", icon: Receipt },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/announcements/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // Failed to fetch unread count
      }
    };
    fetchUnreadCount();
    const handleToggle = () => setMobileMenuOpen(prev => !prev);
    window.addEventListener('toggleMobileMenu', handleToggle);
    return () => window.removeEventListener('toggleMobileMenu', handleToggle);
  }, [pathname]); // Refresh count when navigation changes

  return (
    <>
      {/* Sidebar Navigation */}
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header - fixed at top */}
        <div className="flex items-center justify-between p-6 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-accent-gold shrink-0" />
            <span className="font-heading text-base font-bold tracking-wider leading-tight">ONLINE HALL<br/>MEAL MANAGER</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation - scrollable */}
        <div className="flex-1 px-4 space-y-2 overflow-y-auto min-h-0">
          {studentNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-gold rounded-r-md"></span>
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-accent-gold" : "text-white/70 group-hover:text-white")} />
                <span className="flex-1">{item.name}</span>
                {item.name === "Announcements" && unreadCount > 0 && (
                  <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[20px]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout - sticky at bottom */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-primary">
          <Button 
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-start gap-3 text-white/70 hover:text-white hover:bg-white/5 px-4 py-3 h-auto justify-start"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
