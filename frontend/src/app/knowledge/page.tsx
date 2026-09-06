"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { KnowledgeDoc, fetchKnowledgeDocs, uploadKnowledgeDoc } from "@/lib/api-client";
import { FadeIn, StaggerContainer, StaggerItem } from "@/lib/motion";

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("brand");
  const [uploadTags, setUploadTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchKnowledgeDocs()
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load knowledge base. Verify API connection.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = docs.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group docs by title to get unique documents with chunk counts
  const groupedDocs = filteredDocs.reduce(
    (acc, doc) => {
      if (!acc[doc.title]) {
        acc[doc.title] = { ...doc, chunkCount: 1 };
      } else {
        acc[doc.title].chunkCount += 1;
      }
      return acc;
    },
    {} as Record<string, KnowledgeDoc & { chunkCount: number }>
  );
  const uniqueDocs = Object.values(groupedDocs);

  const getDocTypeBadgeVariant = (type: string) => {
    const map: Record<string, "default" | "mql" | "warning" | "sql"> = {
      brand: "default",
      product: "mql",
      faq: "warning",
      case_study: "sql",
    };
    return map[type] || "default";
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const tagsList = uploadTags
        ? uploadTags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;
      const res = await uploadKnowledgeDoc(selectedFile, uploadType, tagsList);
      setIsUploading(false);
      setUploadSuccess(res.message || "File uploaded and queued for ingestion.");
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadSuccess(null);
        setSelectedFile(null);
        setUploadTags("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData();
      }, 1500);
    } catch (err) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Knowledge base error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Knowledge base</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vector embeddings for grounding AI-generated content.
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload document
          </Button>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Documents</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{uniqueDocs.length}</div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Total chunks</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{docs.length}</div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Search */}
      <FadeIn delay={0.15}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="pl-9 h-9 text-sm bg-card"
          />
        </div>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.2}>
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Document</TableHead>
                <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[90px] text-right">Chunks</TableHead>
                <TableHead className="w-[100px] text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16">
                    <div className="space-y-2">
                      <Database className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? "No documents match your search." : "No documents indexed yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                uniqueDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="pl-6">
                      <div className="text-sm font-medium text-foreground">{doc.title}</div>
                      {doc.source_file && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {doc.source_file}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDocTypeBadgeVariant(doc.doc_type)} className="uppercase font-mono text-[10px]">
                        {doc.doc_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm tabular-nums">
                      {doc.chunkCount}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge
                        variant={doc.ingestion_status === "completed" ? "published" : "scheduled"}
                        className="text-[10px]"
                      >
                        {doc.ingestion_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </FadeIn>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base">Upload document</DialogTitle>
              <DialogDescription className="text-sm">
                Upload files to chunk and index into the vector store.
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

              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground bg-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <span className="font-semibold text-foreground">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <>
                    <div>Click to select a document from your computer</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      .md, .txt, .pdf, .docx — max 20MB
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {["brand", "product", "faq", "case_study", "general"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className={`rounded-lg border px-3 py-1.5 text-sm uppercase font-mono transition-colors ${
                        uploadType === type
                          ? "border-primary bg-accent text-accent-foreground font-medium"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-tags" className="text-sm">Tags (optional, comma-separated)</Label>
                <Input
                  id="doc-tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., pricing, v2, release-notes"
                  className="text-sm"
                />
              </div>

              {uploadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isUploading || !!uploadSuccess}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload and index"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
