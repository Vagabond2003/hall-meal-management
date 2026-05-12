"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  max = 5,
  size = 20,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive ? hoverRating || rating : rating;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(i + 1)}
          onMouseEnter={() => interactive && setHoverRating(i + 1)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={cn(
            "transition-transform",
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
        >
          <Star
            className={cn(
              i < displayRating
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300",
              interactive && i < hoverRating && "text-amber-500 fill-amber-500"
            )}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}
