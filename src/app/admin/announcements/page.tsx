"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Megaphone,
  Trash2,
  AlertTriangle,
  Siren,
  Heart,
  Eye,
  X,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  created_at: string;
  read_count: number;
  like_count: number;
}

const scaleFadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

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

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, priority })
      });

      if (!res.ok) throw new Error("Failed to post announcement");
      
      toast.success("Announcement posted successfully");
      setIsModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error("Failed to post announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${itemToDelete}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete announcement");
      
      toast.success("Announcement deleted sequentially");
      setAnnouncements(prev => prev.filter(a => a.id !== itemToDelete));
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setPriority("normal");
  };

  const PriorityBadgeConfig = {
    normal: {
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      label: "Normal",
      icon: null
    },
    important: {
      bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500",
      label: "Important",
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />
    },
    urgent: {
      bg: "bg-danger/10 text-danger",
      label: "Urgent",
      icon: <Siren className="w-3.5 h-3.5 mr-1" />
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Announcements</h1>
          <p className="mt-1 text-text-secondary">Post notices and updates for all students</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white shadow-md transition-all sm:w-auto w-full group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          New Announcement
        </Button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface border border-border/50 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">No announcements yet</h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            Post an announcement to notify students about important updates, changes, or general news.
          </p>
          <Button 
            variant="outline"
            className="mt-6"
            onClick={() => setIsModalOpen(true)}
          >
            Create Your First Post
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {announcements.map((ann) => (
            <motion.div 
              key={ann.id}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-surface border border-border/50 rounded-2xl p-6 shadow-sm transition-all relative overflow-hidden group"
            >
              {ann.priority === "urgent" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger"></div>
              )}
              {ann.priority === "important" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>
              )}
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PriorityBadgeConfig[ann.priority].bg}`}>
                  {PriorityBadgeConfig[ann.priority].icon}
                  {PriorityBadgeConfig[ann.priority].label}
                </span>
                
                <button 
                  onClick={() => setItemToDelete(ann.id)}
                  className="text-text-secondary hover:text-danger hover:bg-danger/10 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="pl-2">
                <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
                  {ann.title}
                </h3>
                <p className="text-text-secondary whitespace-pre-line mb-6 font-sans">
                  {ann.body}
                </p>
                
                <div className="flex items-center justify-between text-xs text-text-secondary pt-4 border-t border-border/50">
                  <span className="font-medium">
                    Posted {format(new Date(ann.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5" title="Read receipts">
                      <Eye className="w-4 h-4" />
                      {ann.read_count} read
                    </span>
                    <span className="flex items-center gap-1.5" title="Likes">
                      <Heart className="w-4 h-4 text-rose-500/80" />
                      {ann.like_count} liked
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* New Announcement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              variants={scaleFadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-bold text-text-primary">New Announcement</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:bg-surface-secondary p-2 rounded-full transition-colors relative -right-2 -top-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 font-heading"
                    placeholder="E.g., Feast Night This Friday!"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border/50 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 resize-none font-sans"
                    placeholder="What do students need to know?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Priority</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPriority("normal")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                        priority === "normal" 
                          ? "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100" 
                          : "border-border/50 text-text-secondary hover:bg-surface-secondary"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority("important")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                        priority === "important" 
                          ? "bg-warning/10 border-warning/30 text-warning" 
                          : "border-border/50 text-text-secondary hover:bg-surface-secondary"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 relative -top-0.5" />
                      Important
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority("urgent")}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                        priority === "urgent" 
                          ? "bg-danger/10 border-danger/30 text-danger" 
                          : "border-border/50 text-text-secondary hover:bg-surface-secondary"
                      }`}
                    >
                      <Siren className="w-3.5 h-3.5 inline mr-1.5 relative -top-0.5" />
                      Urgent
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Megaphone className="w-4 h-4 mr-2" />
                    )}
                    Post Announcement
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setItemToDelete(null)}
            />
            
            <motion.div 
              variants={scaleFadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 z-10 text-center"
            >
              <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Delete Announcement?</h3>
              <p className="text-text-secondary text-sm mb-6">
                Are you sure you want to delete this announcement? This action cannot be undone and will remove all student interactions.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setItemToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
