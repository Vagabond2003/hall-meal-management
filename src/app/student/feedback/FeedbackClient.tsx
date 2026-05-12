"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { MessageSquare, Star, Loader2, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StarRating from "@/components/shared/StarRating";
import { EmptyState } from "@/components/shared/EmptyState";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MealHistoryItem {
  id: string;
  date: string;
  weekly_menu_id: string | null;
  meals: { name: string; description: string | null; price: number; meal_type: string } | null;
  weekly_menus: { meal_slot: string; items: string | null; price: number; week_start_date: string } | null;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  date: string;
  created_at: string;
  weekly_menu_id: string;
  student: { name: string; token_number: string };
  weekly_menu: { meal_slot: string; items: string; week_start_date: string };
  replies: Array<{ id: string; reply: string; created_at: string; admin: { name: string } }>;
}

interface MealWithFeedback {
  meal: MealHistoryItem;
  feedback: FeedbackItem | null;
}

export default function FeedbackClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [meals, setMeals] = useState<MealWithFeedback[]>([]);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editRatings, setEditRatings] = useState<Record<string, number>>({});
  const [editComments, setEditComments] = useState<Record<string, string>>({});

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const fetchMealsAndFeedback = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch meal history
      const historyRes = await fetch(`/api/student/history?month=${month}&year=${year}`);
      if (!historyRes.ok) throw new Error("Failed to load meal history");
      const historyData = await historyRes.json();
      const historyItems: MealHistoryItem[] = historyData.history ?? [];

      // Filter to only show past meals (date <= today)
      const todayStr = now.toISOString().split('T')[0];
      const pastMeals = historyItems.filter(item => item.date <= todayStr);

      // Fetch feedback for each meal
      const mealsWithFeedback: MealWithFeedback[] = await Promise.all(
        pastMeals.map(async (meal) => {
          if (!meal.weekly_menu_id) {
            return { meal, feedback: null };
          }
          try {
            const feedbackRes = await fetch(
              `/api/student/feedback?weekly_menu_id=${meal.weekly_menu_id}&date=${meal.date}`
            );
            if (feedbackRes.ok) {
              const feedbackData = await feedbackRes.json();
              const feedbackList: FeedbackItem[] = feedbackData.feedback ?? [];
              // Find this student's feedback
              const myFeedbackItem = feedbackList.find((f: any) => f.student_id === "current"); // Will be filtered on server
              return { meal, feedback: myFeedbackItem || null };
            }
          } catch {
            // Ignore feedback fetch errors
          }
          return { meal, feedback: null };
        })
      );

      // Fetch all feedback for this student
      const allFeedbackRes = await fetch(`/api/student/feedback?month=${month}&year=${year}`);
      let allFeedback: FeedbackItem[] = [];
      if (allFeedbackRes.ok) {
        const allFeedbackData = await allFeedbackRes.json();
        allFeedback = allFeedbackData.feedback ?? [];
      }

      setMeals(mealsWithFeedback);
      setMyFeedback(allFeedback);
    } catch (error) {
      toast.error("Failed to load meals");
    } finally {
      setLoading(false);
    }
  }, [month, year, now]);

  useEffect(() => {
    fetchMealsAndFeedback();
  }, [fetchMealsAndFeedback]);

  const handleSubmitFeedback = async (meal: MealHistoryItem, rating: number, comment: string) => {
    if (!meal.weekly_menu_id) {
      toast.error("Cannot rate this meal");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setSubmittingId(meal.id);
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: meal.weekly_menu_id,
          date: meal.date,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Feedback submitted!");
      await fetchMealsAndFeedback();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleEditFeedback = async (feedbackId: string, rating: number, comment: string) => {
    const feedback = myFeedback.find(f => f.id === feedbackId);
    if (!feedback) return;

    setSubmittingId(feedbackId);
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_menu_id: feedback.weekly_menu_id,
          date: feedback.date,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update feedback");
      }

      toast.success("Feedback updated!");
      setEditMode(prev => ({ ...prev, [feedbackId]: false }));
      await fetchMealsAndFeedback();
    } catch (error: any) {
      toast.error(error.message || "Failed to update feedback");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/student/feedback?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feedback");
      toast.success("Feedback deleted");
      setDeleteDialogOpen(false);
      setDeleteId(null);
      await fetchMealsAndFeedback();
    } catch {
      toast.error("Failed to delete feedback");
    }
  };

  const mealsToRate = meals.filter(m => !m.feedback);
  const mealsRated = myFeedback;

  const getMealDisplay = (meal: MealHistoryItem) => {
    const special = Array.isArray(meal.meals) ? meal.meals[0] : meal.meals;
    const regular = Array.isArray(meal.weekly_menus) ? meal.weekly_menus[0] : meal.weekly_menus;
    const displayName = regular?.meal_slot ?? special?.name ?? "—";
    const items = regular?.items ?? special?.description ?? "—";
    return { displayName, items };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Meal Feedback</h1>
        <p className="mt-1 text-text-secondary text-sm">Rate meals you've had and share your thoughts.</p>
      </div>

      {/* Month/Year Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rate">Rate Meals</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
        </TabsList>

        {/* Rate Meals Tab */}
        <TabsContent value="rate" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : mealsToRate.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12 opacity-20" />}
              title="No meals to rate yet"
              description="You've rated all your meals for this month, or haven't had any meals yet."
            />
          ) : (
            <div className="space-y-4">
              {mealsToRate.map(({ meal }) => {
                const { displayName, items } = getMealDisplay(meal);
                const [rating, setRating] = useState(0);
                const [comment, setComment] = useState("");

                return (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                          {displayName} — {format(new Date(meal.date), "EEE, MMM d")}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">{items}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary mb-2 block">Your Rating</label>
                        <StarRating
                          rating={rating}
                          interactive
                          onRate={setRating}
                          size={24}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-text-secondary mb-2 block">
                          Your Feedback (optional)
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write your feedback..."
                          rows={3}
                          maxLength={500}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                        <p className="text-xs text-text-secondary mt-1 text-right">
                          {comment.length}/500
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleSubmitFeedback(meal, rating, comment);
                          setRating(0);
                          setComment("");
                        }}
                        disabled={submittingId === meal.id || rating < 1}
                        className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submittingId === meal.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Feedback"
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Reviews Tab */}
        <TabsContent value="reviews" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : mealsRated.length === 0 ? (
            <EmptyState
              icon={<Star className="w-12 h-12 opacity-20" />}
              title="No reviews yet"
              description="You haven't submitted any feedback for your meals."
            />
          ) : (
            <div className="space-y-4">
              {mealsRated.map((feedback) => {
                const isEditing = editMode[feedback.id];
                const currentRating = isEditing ? editRatings[feedback.id] || feedback.rating : feedback.rating;
                const currentComment = isEditing ? editComments[feedback.id] || feedback.comment || "" : feedback.comment || "";

                return (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border/50 shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {feedback.weekly_menu.meal_slot} — {format(new Date(feedback.date), "EEE, MMM d")}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1">{feedback.weekly_menu.items}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => {
                                setEditMode(prev => ({ ...prev, [feedback.id]: true }));
                                setEditRatings(prev => ({ ...prev, [feedback.id]: feedback.rating }));
                                setEditComments(prev => ({ ...prev, [feedback.id]: feedback.comment || "" }));
                              }}
                              className="p-2 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(feedback.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-danger transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <StarRating rating={currentRating} size={20} />
                        <span className="text-sm font-medium text-text-primary">{currentRating}/5</span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-text-secondary mb-2 block">Edit Rating</label>
                            <StarRating
                              rating={currentRating}
                              interactive
                              onRate={(r) => setEditRatings(prev => ({ ...prev, [feedback.id]: r }))}
                              size={24}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-text-secondary mb-2 block">Edit Comment</label>
                            <textarea
                              value={currentComment}
                              onChange={(e) => setEditComments(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                              placeholder="Edit your feedback..."
                              rows={3}
                              maxLength={500}
                              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            />
                            <p className="text-xs text-text-secondary mt-1 text-right">
                              {currentComment.length}/500
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFeedback(feedback.id, currentRating, currentComment)}
                              disabled={submittingId === feedback.id}
                              className="flex-1 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {submittingId === feedback.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </button>
                            <button
                              onClick={() => setEditMode(prev => ({ ...prev, [feedback.id]: false }))}
                              className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {currentComment && (
                            <p className="text-sm text-text-secondary bg-surface-secondary rounded-xl p-4">
                              {currentComment}
                            </p>
                          )}

                          {feedback.replies && feedback.replies.length > 0 && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                              <p className="text-xs font-semibold text-primary mb-2">Admin Reply</p>
                              <p className="text-sm text-text-secondary">{feedback.replies[0].reply}</p>
                              <p className="text-xs text-text-secondary mt-2">
                                — {feedback.replies[0].admin.name}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFeedback}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
