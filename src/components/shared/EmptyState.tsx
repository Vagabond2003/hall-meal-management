import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="mb-4 text-text-disabled">
        {icon}
      </div>
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm font-sans text-text-secondary">
        {description}
      </p>
    </div>
  );
}
