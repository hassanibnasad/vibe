"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      id = String(Date.now()),
      title,
      description,
      variant = "default",
      duration = 4000,
      onUndo,
      undoLabel = "Undo",
    }: ToastOptions) => {
      const newToast: ToastOptions = {
        id,
        title,
        description,
        variant,
        duration,
        onUndo,
        undoLabel,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border p-3.5 shadow-elevated bg-card text-foreground transition-all duration-normal animate-in slide-in-from-bottom-2",
              t.variant === "success" && "border-emerald-500/30",
              t.variant === "error" && "border-rose-500/30",
              t.variant === "default" && "border-border"
            )}
            role="status"
          >
            <div className="flex items-start gap-2.5">
              {t.variant === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              {t.variant === "error" && (
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              {t.variant === "default" && (
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{t.title}</p>
                {t.description && (
                  <p className="text-[11px] text-muted-foreground">{t.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    t.onUndo?.();
                    if (t.id) dismiss(t.id);
                  }}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  {t.undoLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => t.id && dismiss(t.id)}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Dismiss toast"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
