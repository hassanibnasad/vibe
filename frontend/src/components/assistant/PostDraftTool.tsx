"use client";

import React, { useState } from "react";
import { Copy, Check, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface PostDraftData {
  title?: string;
  content: string;
  hashtags: string[];
}

export function PostDraftTool({ postData }: { postData: PostDraftData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(postData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="my-2 border-border bg-muted/40 shadow-none">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold">
            {postData.title || "Proposed LinkedIn Draft"}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-[11px] gap-1">
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Link href="/studio">
            <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] gap-1">
              <span>Open in Studio</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="rounded-md border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground">
          {postData.content}
        </div>
        {postData.hashtags && postData.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {postData.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
