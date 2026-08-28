"use client";

import React, { useState } from "react";
import {
  Database,
  Upload,
  Search,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [chunkInspectorOpen, setChunkInspectorOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<KnowledgeDocument["doc_type"]>("brand");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [docs, setDocs] = useState<KnowledgeDocument[]>([
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
  ]);

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalChunks = docs.reduce((acc, d) => acc + d.chunk_count, 0);

  const handleInspectChunks = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setChunkInspectorOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}`,
        title: uploadTitle.trim(),
        doc_type: uploadType,
        chunk_count: Math.floor(Math.random() * 15) + 5,
        embedding_model: "all-minilm:l6-v2 (384-dim)",
        similarity_threshold: 0.35,
        last_indexed: "Just now",
        size_kb: 36,
      };

      setDocs((prev) => [newDoc, ...prev]);
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadSuccess(false);
        setUploadTitle("");
      }, 1000);
    }, 800);
  };

  const getDocTypeBadgeVariant = (type: KnowledgeDocument["doc_type"]) => {
    switch (type) {
      case "brand":
        return "default";
      case "product":
        return "mql";
      case "faq":
        return "warning";
      case "case_study":
        return "sql";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Database className="h-4 w-4 text-foreground" />
            <span>Brand Knowledge & RAG Index</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vector embeddings stored in PostgreSQL pgvector to ground AI generated drafts and replies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload document</span>
          </Button>
        </div>
      </div>

      {/* RAG Telemetry Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground">Indexed Documents</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{docs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground">Total Vector Chunks</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{totalChunks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[11px] text-muted-foreground">Active Vector Index</div>
            <div className="text-xs font-mono font-medium text-foreground mt-1">
              pgvector • 384-dim (Cosine)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Action Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search indexed knowledge documents..."
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* Document Data Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[100px] text-right">Chunks</TableHead>
              <TableHead className="w-[180px]">Embedding Model</TableHead>
              <TableHead className="w-[120px]">Last Indexed</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                  No documents found matching search term.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-semibold text-foreground text-xs">{doc.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {doc.size_kb} KB • ID: {doc.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDocTypeBadgeVariant(doc.doc_type)} className="text-[10px] uppercase font-mono py-0 h-4">
                      {doc.doc_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">
                    {doc.chunk_count}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {doc.embedding_model}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {doc.last_indexed}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInspectChunks(doc)}
                      className="h-7 text-xs px-2"
                    >
                      Inspect Chunks
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Chunk Inspector Dialog */}
      <Dialog open={chunkInspectorOpen} onOpenChange={setChunkInspectorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Chunk Inspector: {selectedDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preview vector embeddings and text chunks indexed in pgvector.
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-3 py-2 text-xs max-h-[350px] overflow-y-auto pr-1">
              {[1, 2, 3].map((chunkIdx) => (
                <div key={chunkIdx} className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                    <span>Chunk #{chunkIdx} of {selectedDoc.chunk_count}</span>
                    <span>Tokens: ~128 • Cosine Threshold: {selectedDoc.similarity_threshold}</span>
                  </div>
                  <p className="text-foreground leading-relaxed font-sans text-xs">
                    &ldquo;Autonomous agents execute bounded responsibilities across LinkedIn inbound events. High-confidence interactions (&gt;= 0.85) trigger automated scheduled publishing; low-confidence threads route to operator review queue.&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChunkInspectorOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Upload Knowledge Document</DialogTitle>
              <DialogDescription className="text-xs">
                Upload Markdown, PDF, or text files to chunk and index into pgvector.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="doc-title" className="text-xs">Document Title</Label>
                <Input
                  id="doc-title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Q3 Product Release Notes & Playbook"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Document Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["brand", "product", "faq", "case_study"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className={`rounded-md border p-2 text-left uppercase text-[11px] font-mono transition-colors ${
                        uploadType === type
                          ? "border-primary bg-accent text-accent-foreground font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mock File Dropzone */}
              <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground bg-muted/20">
                <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div>Drag file here or click to select (.md, .txt, .pdf)</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Maximum file size: 10MB</div>
              </div>

              {uploadSuccess && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Document chunked and vector embeddings indexed.</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!uploadTitle.trim() || isUploading || uploadSuccess}
                className="text-xs"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    <span>Chunking & Indexing...</span>
                  </>
                ) : (
                  <span>Index Document</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
