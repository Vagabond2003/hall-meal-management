"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Ticket,
  Loader2,
  Copy,
  Check,
  Search,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  AlertTriangle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

interface InviteCode {
  id: string;
  code: string;
  status: "available" | "used" | "expired";
  is_used: boolean;
  expires_at: string;
  created_at: string;
  used_by_name: string | null;
}

interface Stats {
  total: number;
  available: number;
  used: number;
  expired: number;
}

const scaleFadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

type FilterTab = "all" | "available" | "used" | "expired";

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/invite-codes");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCodes(data.codes || []);
      setStats(data.stats || { total: 0, available: 0, used: 0, expired: 0 });
    } catch {
      toast.error("Failed to load invite codes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setShowConfirm(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/invite-codes/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate");
      toast.success(`${data.count} invite codes generated successfully`);
      fetchCodes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const filteredCodes = useMemo(() => {
    let filtered = codes;
    if (activeTab !== "all") {
      filtered = filtered.filter((c) => c.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      filtered = filtered.filter(
        (c) => c.status === "available" && c.code.includes(q)
      );
    }
    return filtered;
  }, [codes, activeTab, searchQuery]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "available", label: "Available", count: stats.available },
    { key: "used", label: "Used", count: stats.used },
    { key: "expired", label: "Expired", count: stats.expired },
  ];

  const statusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Available
          </span>
        );
      case "used":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            <Check className="w-3 h-3" />
            Used
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            <XCircle className="w-3 h-3" />
            Expired
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Invite Codes</h1>
          <p className="mt-1 text-text-secondary">Generate and manage student registration codes</p>
        </div>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={generating}
          className="bg-primary hover:bg-primary-dark text-white shadow-md transition-all sm:w-auto w-full group"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          )}
          Generate 400 Codes
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Codes", value: stats.total, icon: BarChart3, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Available", value: stats.available, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Used", value: stats.used, icon: Check, color: "text-slate-500", bg: "bg-slate-100" },
          { label: "Expired", value: stats.expired, icon: Clock, color: "text-red-500", bg: "bg-red-100" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search available codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCodes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border/50 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
            {searchQuery ? "No codes match your search" : "No invite codes yet"}
          </h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            {searchQuery
              ? "Try a different search term or clear the filter."
              : "Generate invite codes so students can register for the hall meal system."}
          </p>
        </motion.div>
      ) : (
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-slate-50/50">
                  <th className="text-left py-3.5 px-4 font-semibold text-text-secondary">Code</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-text-secondary">Status</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-text-secondary hidden md:table-cell">Created</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-text-secondary hidden md:table-cell">Expires</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-text-secondary hidden lg:table-cell">Used By</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-text-secondary w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => (
                  <tr
                    key={code.id}
                    className="border-b border-border/30 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <code className="font-mono text-sm font-semibold tracking-wider text-text-primary">
                        {code.status === "available" ? code.code : "••••••••"}
                      </code>
                    </td>
                    <td className="py-3 px-4">{statusBadge(code.status)}</td>
                    <td className="py-3 px-4 text-text-secondary hidden md:table-cell">
                      {format(new Date(code.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-text-secondary hidden md:table-cell">
                      {format(new Date(code.expires_at), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-text-secondary hidden lg:table-cell">
                      {code.used_by_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {code.status === "available" && (
                        <button
                          onClick={() => handleCopy(code.code, code.id)}
                          className="p-3 sm:p-2 min-h-[44px] sm:min-h-0 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors inline-flex items-center justify-center"
                          title="Copy code"
                        >
                          {copiedId === code.id ? (
                            <Check className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-5 h-5 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Confirmation Dialog */}
      {showConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowConfirm(false)}
              />
              <motion.div
                variants={scaleFadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10 text-center"
              >
                <button
                  onClick={() => setShowConfirm(false)}
                  className="absolute top-4 right-4 text-text-secondary hover:bg-surface-secondary p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Generate Codes?</h3>
                <p className="text-text-secondary text-sm mb-6">
                  This will generate 400 new invite codes valid for 7 days.
                  Existing unused codes will remain. Continue?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary-dark"
                    onClick={handleGenerate}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
