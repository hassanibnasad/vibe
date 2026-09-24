"use client";

import React, { useState } from "react";
import { Calendar, Inbox } from "lucide-react";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { PostDraftQueue } from "@/components/calendar/PostDraftQueue";

const TABS = [
  { id: "calendar", label: "Content Calendar", icon: Calendar },
  { id: "drafts",   label: "Draft Review",     icon: Inbox     },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex items-end justify-between px-6 pt-6 pb-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {activeTab === "calendar" ? "Content Calendar" : "Draft Review Queue"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTab === "calendar"
              ? "Scheduled and published posts. Drag to reschedule."
              : "AI-generated drafts awaiting operator approval before dispatch."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.07] bg-white/[0.02]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {activeTab === "calendar" ? (
          <ContentCalendar />
        ) : (
          <div className="h-full overflow-y-auto">
            <PostDraftQueue />
          </div>
        )}
      </div>
    </div>
  );
}
