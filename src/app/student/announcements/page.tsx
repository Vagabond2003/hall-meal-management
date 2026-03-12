"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Megaphone,
  AlertTriangle,
  Siren,
  Heart,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  created_at: string;
  is_read: boolean;
  is_liked: boolean;
  like_count?: number;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const staggerItem: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "important" | "urgent">("all");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleInteract = async (id: string, action: "read" | "like") => {
    // Optimistic update
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== id) return ann;
      
      const newIsLiked = action === "like" ? !ann.is_liked : ann.is_liked;
      const newLikeCount = action === "like" 
        ? (ann.like_count || 0) + (newIsLiked ? 1 : -1)
        : ann.like_count;
        
      return {
        ...ann,
        is_read: action === "read" ? true : ann.is_read,
        is_liked: newIsLiked,
        like_count: newLikeCount
      };
    }));

    try {
      const ann = announcements.find(a => a.id === id);
      const is_read = action === "read" ? true : undefined;
      const is_liked = action === "like" ? !ann?.is_liked : undefined;

      const res = await fetch(`/api/announcements/${id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read, is_liked })
      });
      
      if (!res.ok) throw new Error("Failed to update");
      
      if (action === "read") {
        toast.success("Marked as read");
      }
    } catch (error) {
      toast.error("Failed to update status");
      // Revert optimism if needed (omitted for brevity)
    }
  };

  const PriorityBadgeConfig = {
    normal: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: null, label: "Normal" },
    important: { bg: "bg-warning/10 text-warning", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />, label: "Important" },
    urgent: { bg: "bg-danger/10 text-danger", icon: <Siren className="w-3.5 h-3.5 mr-1" />, label: "Urgent" }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    if (filter === "unread") return !ann.is_read;
    if (filter === "important") return ann.priority === "important";
    if (filter === "urgent") return ann.priority === "urgent";
    return true; // all
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Announcements</h1>
        <p className="mt-1 text-text-secondary">Notices and updates from hall administration</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            filter === "all" 
              ? "bg-primary text-white" 
              : "bg-surface border border-border/50 text-text-secondary hover:bg-surface-secondary"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            filter === "unread" 
              ? "bg-primary text-white" 
              : "bg-surface border border-border/50 text-text-secondary hover:bg-surface-secondary"
          }`}
        >
          Unread
          {announcements.filter(a => !a.is_read).length > 0 && (
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              filter === "unread" ? "bg-white/20 text-white" : "bg-danger text-white"
            }`}>
              {announcements.filter(a => !a.is_read).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("important")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            filter === "important" 
              ? "bg-warning text-white" 
              : "bg-surface border border-border/50 text-text-secondary hover:bg-surface-secondary"
          }`}
        >
          Important
        </button>
        <button
          onClick={() => setFilter("urgent")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            filter === "urgent" 
              ? "bg-danger text-white" 
              : "bg-surface border border-border/50 text-text-secondary hover:bg-surface-secondary"
          }`}
        >
          Urgent
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface border border-border/50 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">No announcements found</h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            {filter === "all" 
              ? "There are currently no announcements. Check back later." 
              : `There are no ${filter} announcements at the moment.`}
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {filteredAnnouncements.map((ann) => (
            <motion.div 
              key={ann.id}
              variants={staggerItem}
              className={`bg-white dark:bg-surface border border-border/50 rounded-2xl p-6 shadow-sm transition-all relative overflow-hidden group ${
                ann.is_read ? 'opacity-85' : ''
              }`}
            >
              {!ann.is_read && ann.priority === "urgent" && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger"></div>
              )}
              {!ann.is_read && ann.priority === "important" && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-warning"></div>
              )}
              {!ann.is_read && ann.priority === "normal" && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-slate-300 dark:bg-slate-600"></div>
              )}
              
              <div className="flex justify-between items-start mb-3 sm:pl-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase ${PriorityBadgeConfig[ann.priority].bg}`}>
                  {PriorityBadgeConfig[ann.priority].icon}
                  {PriorityBadgeConfig[ann.priority].label}
                </span>
                
                <span className="text-xs font-semibold text-text-secondary">
                  {format(new Date(ann.created_at), "MMM d, yyyy")}
                </span>
              </div>
              
              <div className="sm:pl-2">
                <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
                  {ann.title}
                </h3>
                <p className="text-text-secondary whitespace-pre-line mb-6 font-sans">
                  {ann.body}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <button
                    onClick={() => handleInteract(ann.id, "read")}
                    disabled={ann.is_read}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      ann.is_read 
                        ? "text-success bg-success/10 opacity-70 cursor-default" 
                        : "text-primary bg-primary/10 hover:bg-primary/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {ann.is_read ? "Read ✓" : "Mark as read"}
                  </button>
                  
                  <button
                    onClick={() => handleInteract(ann.id, "like")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                      ann.is_liked 
                        ? "bg-accent-gold/10 text-accent-gold border-accent-gold/20 font-bold" 
                        : "bg-surface text-slate-500 border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${ann.is_liked ? "fill-current text-rose-500" : ""}`} />
                    <span className={ann.is_liked ? "text-text-primary" : ""}>
                      {ann.like_count || 0}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
