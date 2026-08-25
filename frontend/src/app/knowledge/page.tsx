"use client";

import React, { useState } from "react";
import {
  Database,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface KnowledgeDocument {
  id: string;
  title: string;
  doc_type: "brand" | "product" | "faq" | "case_study";
  chunk_count: number;
  embedding_model: string;
  similarity_threshold: number;
  last_indexed: string;
  size_kb: number;
}

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const docs: KnowledgeDocument[] = [
    {
      id: "doc-1",
      title: "VibeAgent Core Brand & Tone Guidelines",
      doc_type: "brand",
      chunk_count: 14,
      embedding_model: "all-minilm:l6-v2 (384-dim)",
      similarity_threshold: 0.35,
      last_indexed: "2 hours ago",
      size_kb: 48,
    },
    {
      id: "doc-2",
      title: "Product Architecture & Hatchet Workflow Spec",
      doc_type: "product",
      chunk_count: 32,
      embedding_model: "all-minilm:l6-v2 (384-dim)",
      similarity_threshold: 0.30,
      last_indexed: "Yesterday",
      size_kb: 124,
    },
    {
      id: "doc-3",
      title: "Enterprise Lead Qualification & BANT Playbook",
      doc_type: "faq",
      chunk_count: 18,
      embedding_model: "all-minilm:l6-v2 (384-dim)",
      similarity_threshold: 0.40,
      last_indexed: "3 days ago",
      size_kb: 64,
    },
    {
      id: "doc-4",
      title: "Customer Case Study: 4x Inbound Pipeline for SaaS",
      doc_type: "case_study",
      chunk_count: 8,
      embedding_model: "all-minilm:l6-v2 (384-dim)",
      similarity_threshold: 0.30,
      last_indexed: "5 days ago",
      size_kb: 28,
    },
  ];

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-400" />
            <span>Brand Knowledge & RAG Index</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ground agent content generation and replies with verified company documents stored in pgvector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="gap-1.5 rounded-xl text-xs">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* RAG Vector Index Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 border-purple-500/20 bg-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Vector Store</span>
            <Database className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">pgvector (PostgreSQL 16)</div>
          <p className="text-xs text-slate-400 mt-1">HNSW Cosine Distance Search</p>
        </Card>

        <Card className="p-5 border-blue-500/20 bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Indexed Chunks</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">72 Chunks</div>
          <p className="text-xs text-slate-400 mt-1">Avg 350 tokens per chunk</p>
        </Card>

        <Card className="p-5 border-emerald-500/20 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Embedding Engine</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">Fast MiniLM / OpenAI</div>
          <p className="text-xs text-slate-400 mt-1">Zero GPU overhead on CPU</p>
        </Card>
      </div>

      {/* Document Library Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Document Library</CardTitle>
              <CardDescription>Documents actively queried during RAG retrieval</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search knowledge docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-800">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {doc.doc_type.replace("_", " ")}
                      </Badge>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                      <span>•</span>
                      <span>{doc.size_kb} KB</span>
                      <span>•</span>
                      <span>Indexed {doc.last_indexed}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="success" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Vectorized</span>
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Re-index
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
