"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center max-w-md mx-auto space-y-3",
        className
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground">
          <Icon className="h-5 w-5 stroke-[1.5]" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-sans text-sm font-semibold text-foreground tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="font-sans text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
