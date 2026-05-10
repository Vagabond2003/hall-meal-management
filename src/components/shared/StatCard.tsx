"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  suffix?: string;
  prefix?: string;
  caption?: string;
  delay?: number;
  isText?: boolean; // if true, skip count-up and show as text
  valueColor?: string;
  onClick?: () => void;
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target === 0) {
      setCount(target);
      return;
    }
    const timer = setTimeout(() => {
      started.current = true;
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return count;
}

export function StatCard({
  label,
  value,
  icon,
  iconBg = "bg-primary/10",
  suffix = "",
  prefix = "",
  caption,
  delay = 0,
  isText = false,
  valueColor,
  onClick,
}: StatCardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const count = useCountUp(isText ? 0 : numericValue, 1200, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: "easeOut" }}
      whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
      onClick={onClick}
      className={cn(
        "bg-surface rounded-2xl border p-6 shadow-sm transition-shadow",
        onClick
          ? "cursor-pointer hover:border-primary/40 border-border/50"
          : "border-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          {icon}
        </div>
      </div>
      <div className={cn("text-3xl font-heading font-bold", valueColor || "text-text-primary")}>
        {prefix}
        {isText ? (
          <span>{value}</span>
        ) : (
          <span>{count.toLocaleString()}</span>
        )}
        {suffix}
      </div>
      {caption && <p className="text-xs text-text-secondary mt-1">{caption}</p>}
    </motion.div>
  );
}
