"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Star, Loader2, Send, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ── Types ──
interface Reply {
  id: string;
  reply: string;
  created_at: string;
  updated_at: string;
  admin: { name: string };
}

interface FeedbackItem {
  id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  student: { name: string; token_number: string };
  replies: Reply[];
}

interface FeedbackModalProps {
  weeklyMenuId: string;
  date: string;
  mealName: string;
  mealItems: string;
  onClose: () => void;
  currentUserId: string;
  isAdmin: boolean;
}

// ── Helpers ──
const AVATAR_COLORS = ["#185FA5", "#3B6D11", "#993556", "#854F0B", "#0F6E56"];
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StarRow({
  count,
  max = 5,
  size = 17,
  onClick,
}: {
  count: number;
  max?: number;
  size?: number;
  onClick?: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onClick?.(i + 1)}
          disabled={!onClick}
          className={`transition-transform ${onClick ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star
            className={i < count ? "fill-[#C4873A] text-[#C4873A]" : "text-gray-300"}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Component ──
export default function FeedbackModal({
  weeklyMenuId,
  date,
  mealName,
  mealItems,
  onClose,
  currentUserId,
  isAdmin,
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/student/feedback?weekly_menu_id=${weeklyMenuId}&date=${date}`
      );
      if (!res.ok) throw new Error("Failed to load feedback");
      const data = await res.json();
      const items: FeedbackItem[] = data.feedback || [];
      setFeedback(items);

      const mine = items.find((f) => f.student_id === currentUserId);
      if (mine) {
        setMyRating(mine.rating || 0);
        setMyComment(mine.comment || "");
      }
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  }, [weeklyMenuId, date, currentUserId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const averageRating = feedback.length
    ? feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length
    : 0;

  const handleSubmitFeedback = async () => {
    if (myRating < 1) {
      toast.error("Please select a rating (1-5 stars)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: weeklyMenuId,
          date,
          rating: myRating,
          comment: myComment.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }
      toast.success("Feedback submitted!");
      setEditingId(null);
      await fetchFeedback();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/student/feedback?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Feedback deleted");
      setMyRating(0);
      setMyComment("");
      await fetchFeedback();
    } catch {
      toast.error("Failed to delete feedback");
    }
  };

  const handlePostReply = async (feedbackId: string) => {
    const text = replyDrafts[feedbackId]?.trim();
    if (!text) return;
    try {
      const res = await fetch("/api/admin/feedback-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: feedbackId, reply: text }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      toast.success("Reply posted");
      setReplyDrafts((prev) => ({ ...prev, [feedbackId]: "" }));
      setReplyOpen((prev) => ({ ...prev, [feedbackId]: false }));
      await fetchFeedback();
    } catch {
      toast.error("Failed to post reply");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const res = await fetch(`/api/admin/feedback-reply?id=${replyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete reply");
      toast.success("Reply deleted");
      await fetchFeedback();
    } catch {
      toast.error("Failed to delete reply");
    }
  };

  const myFeedback = feedback.find((f) => f.student_id === currentUserId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-y-auto py-8 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="bg-[#1A3A2A] p-5 flex justify-between items-start">
          <div className="min-w-0">
            <h2 className="text-white font-heading font-bold text-lg truncate">
              {mealName}
              <span className="font-normal text-white/60 text-sm ml-2">
                — {mealItems}
              </span>
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A3A2A]" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Ratings Section */}
            <div className="grid grid-cols-2 gap-3">
              {/* Your Rating */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Your Rating
                </p>
                {!isAdmin && (
                  <StarRow
                    count={myRating}
                    size={22}
                    onClick={(i) => setMyRating(i)}
                  />
                )}
                {isAdmin && (
                  <p className="text-sm text-gray-400 italic">Admin view</p>
                )}
              </div>
              {/* Average Rating */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Average Rating
                </p>
                <StarRow count={Math.round(averageRating)} size={22} />
                <p className="text-xs text-gray-400 mt-1.5">
                  {averageRating.toFixed(1)} · {feedback.length} student
                  {feedback.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Comments Section */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Comments</p>

              {/* Compose Box (student only) */}
              {!isAdmin && (
                <div className="flex gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: "#1A3A2A" }}
                  >
                    <span className="text-[#C4873A]">
                      {currentUserId ? "Y" : "?"}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#1A3A2A]/20 focus:border-[#1A3A2A] outline-none resize-none transition-all placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || myRating < 1}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1A3A2A] text-white text-sm font-medium hover:bg-[#2D5A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {myFeedback ? "Update" : "Post"}
                    </button>
                  </div>
                </div>
              )}

              {/* Comment List */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {feedback.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    No feedback yet. Be the first to rate this meal!
                  </p>
                )}

                {feedback.map((item) => (
                  <div key={item.id} className="group">
                    {/* Main comment */}
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{
                          backgroundColor: avatarColor(item.student.name),
                        }}
                      >
                        {item.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">
                            {item.student.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                            #{item.student.token_number}
                          </span>
                          <StarRow count={item.rating} size={12} />
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(item.created_at)}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {editingId === item.id ? (
                              <span className="flex flex-col gap-1.5">
                                <textarea
                                  value={editComment}
                                  onChange={(e) =>
                                    setEditComment(e.target.value)
                                  }
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 focus:ring-1 focus:ring-[#1A3A2A]/20 outline-none resize-none"
                                />
                                <span className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      setMyComment(editComment);
                                      handleSubmitFeedback();
                                    }}
                                    className="text-xs px-2.5 py-1 rounded bg-[#1A3A2A] text-white hover:bg-[#2D5A40]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              </span>
                            ) : (
                              item.comment
                            )}
                          </p>
                        )}
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {isAdmin && (
                            <button
                              onClick={() =>
                                setReplyOpen((prev) => ({
                                  ...prev,
                                  [item.id]: !prev[item.id],
                                }))
                              }
                              className="text-[11px] text-gray-400 hover:text-[#1A3A2A] font-medium transition-colors"
                            >
                              Reply
                            </button>
                          )}
                          {item.student_id === currentUserId &&
                            !isAdmin &&
                            editingId !== item.id && (
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditComment(item.comment || "");
                                }}
                                className="text-[11px] text-gray-400 hover:text-blue-600 font-medium transition-colors flex items-center gap-0.5"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          {(item.student_id === currentUserId || isAdmin) &&
                            editingId !== item.id && (
                              <button
                                onClick={() => handleDeleteFeedback(item.id)}
                                className="text-[11px] text-gray-400 hover:text-red-600 font-medium transition-colors flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Reply Thread */}
                    {item.replies.length > 0 && (
                      <div className="ml-11 mt-2 space-y-2">
                        {item.replies.map((r) => (
                          <div
                            key={r.id}
                            className="pl-3 border-l-2 border-b-2 border-gray-200 rounded-bl-lg pb-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-gray-500 italic">
                                Admin
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {timeAgo(r.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {r.reply}
                            </p>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteReply(r.id)}
                                className="text-[11px] text-gray-400 hover:text-red-600 font-medium mt-1 flex items-center gap-0.5 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Reply Input (admin) */}
                    {replyOpen[item.id] && isAdmin && (
                      <div className="ml-11 mt-2 flex gap-2">
                        <textarea
                          value={replyDrafts[item.id] || ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          rows={2}
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-[#1A3A2A]/20 outline-none resize-none"
                        />
                        <button
                          onClick={() => handlePostReply(item.id)}
                          className="self-end px-3 py-1.5 rounded-lg bg-[#1A3A2A] text-white text-xs font-medium hover:bg-[#2D5A40] transition-colors shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
