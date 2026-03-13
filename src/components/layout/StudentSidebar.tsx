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
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Meal Selection", href: "/student/meal-selection", icon: UtensilsCrossed },
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
  }, [pathname]); // Refresh count when navigation changes

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-primary">
          <UtensilsCrossed className="w-6 h-6 text-accent-gold" />
          <span className="font-heading font-bold tracking-wide">ONLINE HALL MEAL MANAGER</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-text-secondary hover:text-primary transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 p-6 mb-6 mt-16 lg:mt-0">
          <UtensilsCrossed className="w-8 h-8 text-accent-gold" />
          <span className="font-heading text-xl font-bold tracking-wider">ONLINE HALL MEAL MANAGER</span>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
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

        <div className="p-4 border-t border-white/10">
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
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
