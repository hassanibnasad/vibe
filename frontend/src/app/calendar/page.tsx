"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchPostDraftQueue } from "@/lib/calendar-api";

export default function CalendarPage() {
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    fetchPostDraftQueue()
      .then((drafts) => setDraftCount(drafts.length))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <PageHeader
        title="Content Calendar"
        description="Scheduled and published posts across your channels. Drag cards to reschedule."
        action={
          draftCount > 0 ? (
            <Link
              href="/review-queue"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-500/15 transition-colors"
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>
                {draftCount} {draftCount === 1 ? "draft" : "drafts"} waiting for review
              </span>
              <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          ) : undefined
        }
      />

      <ContentCalendar />
    </div>
  );
}
