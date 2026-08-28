# Ticket 09: Knowledge & RAG Index Console

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `/knowledge` be redesigned into a structured vector document repository with chunk inspection and upload dialogs?

## Implementation Plan

1. Repository Overview:
   - Header with vector storage metrics (`4 indexed documents • 72 chunks • pgvector cosine metric`).
   - "Upload Document" action opening `<Dialog>`.
2. Document Data Table:
   - Document Title & Type badge (`Brand`, `Product`, `FAQ`, `Case Study`).
   - Chunks count (`font-mono text-right`).
   - Embedding model & dimensions.
   - Similarity threshold setting.
   - Last indexed timestamp.
   - Action menu: "Inspect Chunks", "Re-index", "Delete".
3. Chunk Inspector Dialog:
   - View semantic text chunks, token counts, and embedding preview.
4. Upload Modal with validation:
   - File drag-and-drop zone with supported types (`.md`, `.txt`, `.pdf`).
   - Document type selector with persistent label.
   - Upload progress indicator with active status ("Chunking text...", "Generating embeddings with all-MiniLM-L6-v2...").
