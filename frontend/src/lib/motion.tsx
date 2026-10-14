"use client";

import React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ── Warm, organic easing — slower, more luxurious ──
const warmEase = [0.22, 1, 0.36, 1] as const;

// ── Fade In (single element) ──
export function FadeIn({
  children,
  delay = 0,
  duration = 0.25,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: warmEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Warm Fade In — with scale + blur for dreamy entrance ──
export function WarmFadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: warmEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger Container + Item (for lists/grids) ──
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: warmEase },
  },
};

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ── AnimatePresence wrapper for list removal ──
export function AnimatedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <div className={className}>{children}</div>
    </AnimatePresence>
  );
}

export function AnimatedListItem({
  children,
  layoutId,
  className,
}: {
  children: React.ReactNode;
  layoutId: string;
  className?: string;
}) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: warmEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Page-level transition wrapper (Dreamy 300ms) ──
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: warmEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Floating Element — continuous gentle organic animation ──
export function FloatingElement({
  children,
  className,
  amplitude = 8,
  duration = 6,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [-amplitude, amplitude, -amplitude],
        rotate: [-1, 1, -1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export for convenience
export { AnimatePresence } from "framer-motion";
