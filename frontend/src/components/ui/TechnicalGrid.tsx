"use client";

import React from "react";

export function TechnicalGrid() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-editions-grid opacity-75"
      aria-hidden="true"
    >
      {/* Subtle Top Linear Sheen */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-transparent to-transparent pointer-events-none" />
      {/* Subtle Bottom Linear Sheen */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
