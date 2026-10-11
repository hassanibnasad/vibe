"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCheckProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  delay?: number;
}

export function AnimatedCheck({
  className,
  size = 18,
  strokeWidth = 2.5,
  delay = 0.1,
}: AnimatedCheckProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        className
      )}
      style={{ width: size + 8, height: size + 8 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M20 6L9 17L4 12"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </motion.svg>
    </div>
  );
}

export function PulseBeacon({
  status = "live",
  className,
}: {
  status?: "live" | "idle" | "error";
  className?: string;
}) {
  const colorMap = {
    live: "bg-emerald-500 text-emerald-500",
    idle: "bg-amber-500 text-amber-500",
    error: "bg-rose-500 text-rose-500",
  };

  return (
    <span className={cn("relative flex h-2 w-2 items-center justify-center", className)}>
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", colorMap[status])}
      />
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", colorMap[status])} />
    </span>
  );
}
