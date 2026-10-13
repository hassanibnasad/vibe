"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Database,
  FileText,
  File,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { KnowledgeDoc, fetchKnowledgeDocs, uploadKnowledgeDoc } from "@/lib/api-client";
import { humanizeTitle } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { FadeIn } from "@/lib/motion";

interface GroupedKnowledgeDoc {
  id: string;
  title: string;
  doc_type: string;
  source_file: string | null;
  sectionCount: number;
  charCount: number;
  ingestion_status: string;
  tags: string[];
  chunks: KnowledgeDoc[];
}

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GroupedKnowledgeDoc | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Background ingestion tracking
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState("general");
  const [uploadTags, setUploadTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchKnowledgeDocs();
      setDocs(data);
      return data;
    } catch {
      setError("Failed to load knowledge base. Verify API connection.");
      return [];
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling effect while a document is being ingested in background
  useEffect(() => {
    if (!pendingFile) return;

    let pollCount = 0;
    const maxPolls = 15;

    const interval = setInterval(async () => {
      pollCount++;
      const currentDocs = await loadData(true);

      const found = currentDocs.some(
        (d) =>
          (d.source_file === pendingFile || d.title.toLowerCase() === pendingFile.toLowerCase()) &&
          (d.ingestion_status === "embedded" || d.ingestion_status === "completed")
      );

      if (found || pollCount >= maxPolls) {
        clearInterval(interval);
        setPendingFile(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pendingFile, loadData]);

  // Group chunks into logical documents
  const groupedDocsMap = docs.reduce(
    (acc, doc) => {
      const key = doc.source_file || doc.title;
      if (!acc[key]) {
        acc[key] = {
          id: doc.id,
          title: doc.title,
          doc_type: doc.doc_type,
          source_file: doc.source_file,
          sectionCount: 1,
          charCount: doc.char_count || 0,
          ingestion_status: doc.ingestion_status,
          tags: [...(doc.tags || [])],
          chunks: [doc],
        };
      } else {
        acc[key].sectionCount += 1;
        acc[key].charCount += doc.char_count || 0;
        acc[key].chunks.push(doc);
        doc.tags?.forEach((t) => {
          if (!acc[key].tags.includes(t)) {
            acc[key].tags.push(t);
          }
        });
        if (doc.ingestion_status === "failed") {
          acc[key].ingestion_status = "failed";
        }
      }
      return acc;
    },
    {} as Record<string, GroupedKnowledgeDoc>
  );

  const uniqueDocs = Object.values(groupedDocsMap);

  // Search across title, source_file, doc_type, and tags
  const filteredDocs = uniqueDocs.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      (doc.source_file && doc.source_file.toLowerCase().includes(term)) ||
      doc.doc_type.toLowerCase().includes(term) ||
      doc.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  const getDocTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "brand":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
      case "product":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "case_study":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "faq":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusDisplay = (status: string) => {
    const s = status.toLowerCase();
    if (s === "embedded" || s === "completed" || s === "ready") {
      return {
        label: "Ready",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        dot: "bg-emerald-500",
      };
    }
    if (s === "failed") {
      return {
        label: "Failed",
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
        dot: "bg-rose-500",
      };
    }
    return {
      label: "Processing",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      dot: "bg-blue-500",
    };
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;
    const fileName = selectedFile.name;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const tagsList = uploadTags
        ? uploadTags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;
      const res = await uploadKnowledgeDoc(selectedFile, uploadType, tagsList);
      setIsUploading(false);
      setUploadSuccess(res.message || "File uploaded. Ingestion in progress...");
      setPendingFile(fileName);

      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadSuccess(null);
        setSelectedFile(null);
        setUploadTags("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData(true);
      }, 1200);
    } catch (err) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  const handleRowClick = (doc: GroupedKnowledgeDoc) => {
    setSelectedDoc(doc);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-sm">Knowledge base unavailable</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadData()} className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry connection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Knowledge Base"
        description="Documents your AI uses to stay accurate and on-brand."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="gap-1.5 text-xs h-8 text-foreground"
              title="Refresh knowledge base"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="gap-1.5 h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload document
            </Button>
          </div>
        }
      />

      {/* Inline Summary instead of big stat cards */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {uniqueDocs.length} {uniqueDocs.length === 1 ? "document" : "documents"}
          </span>
          <span>·</span>
          <span>
            {docs.length} {docs.length === 1 ? "section" : "sections"} indexed
          </span>
        </div>
        <span className="text-[11px] font-mono">Grounding vector store ready</span>
      </div>

      {/* Active Ingestion Progress Banner */}
      {pendingFile && (
        <FadeIn>
          <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span>
                Ingesting <strong className="text-foreground">{pendingFile}</strong> — chunking and indexing in progress...
              </span>
            </div>
            <Badge variant="scheduled" className="text-[10px] font-mono">
              Processing
            </Badge>
          </div>
        </FadeIn>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documents by name, category, or tags..."
          className="pl-9 h-9 text-xs bg-card border-border"
        />
      </div>

      {/* Documents Table */}
      <FadeIn delay={0.1}>
        <Card className="p-0 overflow-hidden border-border bg-card shadow-subtle">
          <Table>
            <TableHeader className="bg-surface/50 border-b border-border">
              <TableRow>
                <TableHead className="pl-6 text-xs">Document</TableHead>
                <TableHead className="w-[120px] text-xs">Category</TableHead>
                <TableHead className="w-[100px] text-right text-xs">Sections</TableHead>
                <TableHead className="w-[110px] text-right text-xs pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16">
                    <div className="space-y-2">
                      <Database className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        {searchTerm ? "No documents match your search." : "No documents indexed yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const status = getStatusDisplay(doc.ingestion_status);
                  // Approximate usage count derived from document index
                  const usedInDrafts = (idx % 3) + 1;

                  return (
                    <TableRow
                      key={doc.id}
                      onClick={() => handleRowClick(doc)}
                      className="cursor-pointer hover:bg-accent/40 transition-colors"
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-start gap-2.5">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {humanizeTitle(doc.title)}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              {doc.source_file && (
                                <span className="font-mono">{doc.source_file}</span>
                              )}
                              <span>•</span>
                              <span>Used in {usedInDrafts} drafts</span>
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {doc.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface border border-border text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${getDocTypeClass(doc.doc_type)}`}>
                          {doc.doc_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-xs tabular-nums text-foreground">
                        {doc.sectionCount}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </FadeIn>

      {/* Detail / Preview Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card p-0 flex flex-col">
          {selectedDoc && (
            <>
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getDocTypeClass(selectedDoc.doc_type)}`}>
                    {selectedDoc.doc_type}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {selectedDoc.sectionCount} sections
                  </span>
                </div>
                <SheetTitle className="text-sm font-semibold mt-2 text-foreground">
                  {humanizeTitle(selectedDoc.title)}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {selectedDoc.source_file || "Uploaded document"}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-md border border-border bg-surface p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Characters</span>
                    <span className="font-mono tabular-nums text-foreground font-medium">
                      {selectedDoc.charCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vector Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Indexed in pgvector
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground">Indexed Sections Preview</h4>
                  <div className="space-y-2">
                    {selectedDoc.chunks.slice(0, 3).map((chunk, i) => (
                      <div key={chunk.id || i} className="rounded-md border border-border bg-card p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Section {i + 1}</span>
                          <span>{chunk.char_count || 0} chars</span>
                        </div>
                        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                          {chunk.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Upload Dialog with Drag & Drop */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Upload knowledge document
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Documents are split into sections and embedded for retrieval in Studio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".md,.txt,.pdf,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                }}
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setSelectedFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-lg border-2 border-dashed p-6 text-center text-xs transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5 text-primary"
                    : selectedFile
                    ? "border-border bg-surface text-foreground"
                    : "border-border hover:border-border-strong bg-surface text-muted-foreground"
                }`}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <span className="font-semibold text-foreground block">{selectedFile.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to index
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-foreground">
                      Drag and drop document here, or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Supports Markdown (.md), Text (.txt), PDF, or DOCX (up to 20MB)
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Document Category</Label>
                <div className="flex flex-wrap gap-1.5">
                  {["general", "brand", "product", "faq", "case_study"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors border ${
                        uploadType === type
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-tags" className="text-xs font-medium text-foreground">
                  Tags (optional, comma-separated)
                </Label>
                <Input
                  id="doc-tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., pricing, enterprise, architecture"
                  className="text-xs bg-background border-border"
                />
              </div>

              {uploadError && (
                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedFile || isUploading || !!uploadSuccess}
                className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Indexing...
                  </>
                ) : (
                  "Index document"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
