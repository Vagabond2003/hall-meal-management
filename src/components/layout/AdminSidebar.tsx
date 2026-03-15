"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  ClipboardList,
  Megaphone,
  BarChart2,
  Ticket
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

const adminNavigation = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Invite Codes", href: "/admin/invite-codes", icon: Ticket },
  { name: "Weekly Menu", href: "/admin/weekly-menu", icon: Calendar },
  { name: "Attendance", href: "/admin/meal-attendance", icon: ClipboardList },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/admin/pending-approvals");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pendingCount);
        }
      } catch (error) {
        console.error("Failed to fetch pending approvals", error);
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <>
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

      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 p-6 mb-6 mt-16 lg:mt-0">
          <div className="w-8 h-8 bg-accent-gold/20 rounded-md flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-accent-gold" />
          </div>
          <span className="font-heading text-xl font-bold tracking-wider text-white">ADMIN PORTAL</span>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          {adminNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-gold rounded-r-md"></span>
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                <div className="flex-1 flex justify-between items-center">
                  <span>{item.name}</span>
                  {item.name === "Students" && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 h-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout Admin</span>
          </Button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
