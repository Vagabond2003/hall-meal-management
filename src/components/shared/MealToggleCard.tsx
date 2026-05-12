"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface MealToggleCardProps {
  mealId: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  price: number;
  isSelected: boolean;
  date: string;
  disabled?: boolean;
  isSpecial?: boolean;
  onToggle?: (mealId: string, selected: boolean) => void;
}

export function MealToggleCard({
  mealId,
  name,
  icon,
  description,
  price,
  isSelected,
  date,
  disabled = false,
  isSpecial = false,
  onToggle,
}: MealToggleCardProps) {
  const inFlightRef = useRef(false);

  const handleToggle = async () => {
    if (disabled || inFlightRef.current) return;

    const newState = !isSelected;
    inFlightRef.current = true;

    onToggle?.(mealId, newState);

    try {
      const res = await fetch("/api/student/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          is_selected: newState,
          meal_id: isSpecial ? mealId : null,
          weekly_menu_id: isSpecial ? null : mealId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update selection");
        // Revert on failure
        onToggle?.(mealId, !newState);
      } else {
        toast.success(newState ? `${name} selected for ${date}` : `${name} deselected`);
      }
    } catch {
      toast.error("Network error. Please try again.");
      // Revert on failure
      onToggle?.(mealId, !newState);
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <motion.div
      layout
      animate={{
        backgroundColor: isSelected
          ? isSpecial
            ? "rgba(196, 135, 58, 0.08)"
            : "rgba(26, 58, 42, 0.06)"
          : "rgba(255,255,255,1)",
        borderColor: isSelected
          ? isSpecial
            ? "rgba(196, 135, 58, 0.4)"
            : "rgba(26, 58, 42, 0.3)"
          : "rgba(228, 226, 218, 1)",
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={cn(
        "relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-shadow",
        isSelected ? "shadow-md" : "shadow-sm hover:shadow-md",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={handleToggle}
    >
      {/* Meal Icon */}
      <div className={cn(
        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
        isSelected
          ? isSpecial ? "bg-accent-gold/20 text-accent-gold" : "bg-primary/10 text-primary"
          : "bg-surface-secondary text-text-secondary"
      )}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold text-sm", isSelected ? "text-text-primary" : "text-text-secondary")}>
            {name}
          </h3>
          {isSpecial && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent-gold text-white px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" /> Special
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-0.5 truncate">{description}</p>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right mr-4">
        <p className={cn("font-heading font-bold text-lg", isSelected ? "text-primary" : "text-text-secondary")}>
          ৳{price.toFixed(0)}
        </p>
        <p className="text-xs text-text-disabled">/day</p>
      </div>

      {/* Toggle Switch */}
      <div
        className={cn(
          "flex-shrink-0 relative w-12 h-6 rounded-full transition-colors duration-250",
          isSelected
            ? isSpecial ? "bg-accent-gold" : "bg-primary"
            : "bg-border"
        )}
      >
        <motion.div
          animate={{ x: isSelected ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </motion.div>
  );
}
