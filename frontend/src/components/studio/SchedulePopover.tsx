"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface SchedulePopoverProps {
  onSchedule: (dateIso: string) => Promise<void> | void;
  disabled?: boolean;
}

export function SchedulePopover({ onSchedule, disabled }: SchedulePopoverProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Default to tomorrow at 09:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState("09:00");

  const handleConfirm = async () => {
    if (!date || !time) return;
    setScheduling(true);

    const targetIso = new Date(`${date}T${time}:00`).toISOString();
    try {
      await onSchedule(targetIso);
      setOpen(false);
      toast({
        title: "Post scheduled",
        description: `Queued for dispatch on ${date} at ${time}.`,
        variant: "success",
        onUndo: () => {
          toast({
            title: "Scheduling undone",
            description: "Post reverted to draft status.",
          });
        },
      });
    } catch {
      toast({
        title: "Failed to schedule",
        description: "Please check your network connection and try again.",
        variant: "error",
      });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 text-xs font-medium border-border hover:bg-accent text-foreground"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Schedule...</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 space-y-3.5 bg-card border-border shadow-elevated">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Schedule Publication
          </h4>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Select optimal distribution time on connected social channels.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <Label htmlFor="sched-date" className="text-[11px] font-medium text-foreground">
              Date
            </Label>
            <Input
              id="sched-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs bg-surface"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sched-time" className="text-[11px] font-medium text-foreground">
              Time
            </Label>
            <Input
              id="sched-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 text-xs bg-surface"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={scheduling}
            className="h-7 text-xs bg-primary text-primary-foreground font-medium"
          >
            {scheduling ? "Scheduling..." : "Confirm Schedule"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
