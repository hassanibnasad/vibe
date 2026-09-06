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
        "relative flex items-center justify-center rounded-full bg-emerald-500/15 p-1 text-emerald-400 ring-1 ring-emerald-500/30",
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
            ease: [0.16, 1, 0.3, 1], // fluid cubic bezier
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
    live: "bg-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]",
    idle: "bg-amber-400 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]",
    error: "bg-rose-400 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]",
  };

  return (
    <span className={cn("relative flex h-2 w-2 items-center justify-center", className)}>
      <motion.span
        animate={{ scale: [1, 2, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", colorMap[status])}
      />
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", colorMap[status])} />
    </span>
  );
}
