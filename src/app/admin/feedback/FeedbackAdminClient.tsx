"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { MessageSquareText, Star, Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StarRating from "@/components/shared/StarRating";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  weekly_menu_id: string;
  student: { name: string; token_number: string; room_number?: string };
  weekly_menu: { meal_slot: string; items: string; week_start_date: string };
  replies: Array<{ id: string; reply: string; created_at: string; admin: { name: string } }>;
}

type MealSlotFilter = "all" | "Breakfast" | "Lunch" | "Dinner";
type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

const FeedbackRow = React.memo(function FeedbackRow({
  feedback,
  index,
  replyDrafts,
  onReplyChange,
  onSendReply,
  sendingReplyId,
}: {
  feedback: FeedbackItem;
  index: number;
  replyDrafts: Record<string, string>;
  onReplyChange: (id: string, value: string) => void;
  onSendReply: (id: string) => void;
  sendingReplyId: string | null;
}) {
  const hasReply = feedback.replies && feedback.replies.length > 0;
  const replyDraft = replyDrafts[feedback.id] || "";
  const isSending = sendingReplyId === feedback.id;

  const truncatedComment = feedback.comment
    ? feedback.comment.length > 60
      ? feedback.comment.substring(0, 60) + "..."
      : feedback.comment
    : "—";
  const truncatedItems = feedback.weekly_menu.items.length > 40
    ? feedback.weekly_menu.items.substring(0, 40) + "..."
    : feedback.weekly_menu.items;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-[#2A3A2B] dark:hover:bg-[#1F2B20]"
    >
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {feedback.student.name}
        </div>
        {feedback.student.room_number && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Room {feedback.student.room_number}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
          #{feedback.student.token_number}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
        {format(new Date(feedback.date), "EEE, MMM d")}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {feedback.weekly_menu.meal_slot}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1" title={feedback.weekly_menu.items}>
          {truncatedItems}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <StarRating rating={feedback.rating} size={16} />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {feedback.rating}/5
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div
          className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate"
          title={feedback.comment || ""}
        >
          {truncatedComment}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {hasReply ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              Replied
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              by {feedback.replies[0].admin.name}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {!hasReply ? (
          <button
            onClick={() => onSendReply(feedback.id)}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5 dark:border-primary/50 dark:text-primary-light dark:hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Reply
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">Replied</span>
        )}
      </td>
    </motion.tr>
  );
});

export default function FeedbackAdminClient() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [mealSlotFilter, setMealSlotFilter] = useState<MealSlotFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/feedback?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setFeedback(data.feedback ?? []);
    } catch (error) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((f) => {
      if (mealSlotFilter !== "all" && f.weekly_menu.meal_slot !== mealSlotFilter) {
        return false;
      }
      if (ratingFilter !== "all" && f.rating !== parseInt(ratingFilter, 10)) {
        return false;
      }
      return true;
    });
  }, [feedback, mealSlotFilter, ratingFilter]);

  const stats = useMemo(() => {
    const totalReviews = feedback.length;
    const averageRating =
      totalReviews > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / totalReviews
        : 0;
    const mealsRated = new Set(
      feedback.map((f) => `${f.weekly_menu_id}-${f.date}`)
    ).size;

    return { totalReviews, averageRating, mealsRated };
  }, [feedback]);

  const handleReplyChange = (id: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSendReply = async (id: string) => {
    const text = replyDrafts[id]?.trim();
    if (!text) {
      toast.error("Please write a reply");
      return;
    }

    setSendingReplyId(id);
    try {
      const res = await fetch("/api/admin/feedback-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: id, reply: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reply");
      }

      toast.success("Reply sent");
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      setReplyOpen((prev) => ({ ...prev, [id]: false }));
      await fetchFeedback();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setSendingReplyId(null);
    }
  };

  const handleReplyButtonClick = (id: string) => {
    setReplyOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">
          Meal Feedback
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Student reviews and ratings for meals.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Reviews"
          value={stats.totalReviews}
          icon={<MessageSquare className="w-5 h-5 text-primary" />}
          delay={0}
        />
        <StatCard
          label="Average Rating"
          value={stats.averageRating.toFixed(1)}
          suffix="/ 5.0"
          icon={<Star className="w-5 h-5 text-primary" />}
          delay={100}
        />
        <StatCard
          label="Meals Rated"
          value={stats.mealsRated}
          icon={<MessageSquareText className="w-5 h-5 text-primary" />}
          delay={200}
        />
      </div>

      {/* Filters */}
      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" as const }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Select */}
          <Select value={month.toString()} onValueChange={(v) => v && setMonth(parseInt(v, 10))}>
            <SelectTrigger className="w-[140px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Select */}
          <Select value={year.toString()} onValueChange={(v) => v && setYear(parseInt(v, 10))}>
            <SelectTrigger className="w-[100px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Meal Slot Filter */}
          <Select
            value={mealSlotFilter}
            onValueChange={(v: MealSlotFilter | null) => v && setMealSlotFilter(v)}
          >
            <SelectTrigger className="w-[140px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="Breakfast">Breakfast</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>

          {/* Rating Filter */}
          <Select value={ratingFilter} onValueChange={(v: RatingFilter | null) => v && setRatingFilter(v)}>
            <SelectTrigger className="w-[100px] dark:bg-[#182218] dark:border-[#2A3A2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5★</SelectItem>
              <SelectItem value="4">4★</SelectItem>
              <SelectItem value="3">3★</SelectItem>
              <SelectItem value="2">2★</SelectItem>
              <SelectItem value="1">1★</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-white dark:bg-[#182218] shadow-sm rounded-2xl border border-slate-100 dark:border-[#2A3A2B] overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
      >
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#2A3A2B]">
            <thead className="bg-[#F0EFE9] dark:bg-[#1F2B20]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Token
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Meal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Comment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Admin Reply
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-[#182218] dark:divide-[#2A3A2B]">
              <AnimatePresence mode="wait">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-slate-100 dark:border-[#2A3A2B]">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-10 bg-slate-100 dark:bg-[#2A3A2B] rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredFeedback.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
                      <EmptyState
                        icon={<MessageSquareText className="w-12 h-12 opacity-20" />}
                        title="No feedback received"
                        description={`No feedback found for ${MONTH_NAMES[month - 1]} ${year} with the selected filters.`}
                      />
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredFeedback.map((item, i) => (
                      <React.Fragment key={item.id}>
                        <FeedbackRow
                          feedback={item}
                          index={i}
                          replyDrafts={replyDrafts}
                          onReplyChange={handleReplyChange}
                          onSendReply={handleReplyButtonClick}
                          sendingReplyId={sendingReplyId}
                        />
                        {replyOpen[item.id] && !item.replies?.length && (
                          <tr className="bg-slate-50 dark:bg-[#1F2B20]">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="flex gap-3">
                                <textarea
                                  value={replyDrafts[item.id] || ""}
                                  onChange={(e) => handleReplyChange(item.id, e.target.value)}
                                  placeholder="Write a reply..."
                                  rows={2}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-[#182218] dark:border-[#2A3A2B] focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                                />
                                <button
                                  onClick={() => handleSendReply(item.id)}
                                  disabled={sendingReplyId === item.id || !replyDrafts[item.id]?.trim()}
                                  className="self-end px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {sendingReplyId === item.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      Send
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
