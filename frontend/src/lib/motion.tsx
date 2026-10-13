"use client";

import React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ── Strict 120–200ms ease-out motion system ──
const easeOut = [0.16, 1, 0.3, 1] as const;

// ── Fade In (single element) ──
export function FadeIn({
  children,
  delay = 0,
  duration = 0.16, // 160ms
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: easeOut }}
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
      staggerChildren: 0.03, // 30ms stagger
      delayChildren: 0.04,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: easeOut },
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.16, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Page-level transition wrapper (Crisp 150ms) ──
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export for convenience
export { AnimatePresence } from "framer-motion";
