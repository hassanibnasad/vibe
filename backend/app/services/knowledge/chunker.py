"""
MarkdownAwareChunker — heading-split then sliding-window fallback.

Strategy:
1. Split on Markdown headings (## / ###) to preserve section coherence.
2. Any section that exceeds ``max_tokens`` is re-split with a sliding
   window (``max_tokens`` size, ``overlap`` overlap).
3. Returns ``list[Chunk]`` — each chunk carries a title, content,
   chunk_index, char_count, and a SHA-256 checksum.

Token counting approximation: 1 token ≈ 4 characters (conservative).
This avoids a tiktoken dependency while keeping chunks safely within
the 512-token limit of all-MiniLM-L6-v2.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass


# 1 token ≈ 4 characters — conservative approximation, no tokeniser dep.
_CHARS_PER_TOKEN = 4


@dataclass
class Chunk:
    """A single, embeddable unit of text extracted from a document."""

    title: str
    content: str
    chunk_index: int
    char_count: int
    checksum: str  # SHA-256 hex digest of content


def _checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _approx_tokens(text: str) -> int:
    return len(text) // _CHARS_PER_TOKEN


# Regex that matches Markdown H1/H2/H3 headings at the start of a line.
_HEADING_RE = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)


class MarkdownAwareChunker:
    """
    Chunk a document string into embeddable pieces.

    Parameters
    ----------
    max_tokens:
        Maximum approximate token count per chunk.  Default 400 leaves
        headroom below MiniLM's 512-token limit.
    overlap_tokens:
        Number of tokens to overlap between sliding-window sub-chunks.
    """

    def __init__(self, max_tokens: int = 400, overlap_tokens: int = 50) -> None:
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens

    def chunk(self, text: str, document_title: str = "") -> list[Chunk]:
        """
        Split ``text`` into ``Chunk`` objects.

        Returns an empty list for empty/whitespace-only input.
        """
        text = text.strip()
        if not text:
            return []

        sections = self._split_by_headings(text, document_title)
        chunks: list[Chunk] = []
        idx = 0

        for section_title, section_body in sections:
            if _approx_tokens(section_body) <= self.max_tokens:
                # Section fits in a single chunk
                content = section_body.strip()
                if content:
                    chunks.append(
                        Chunk(
                            title=section_title,
                            content=content,
                            chunk_index=idx,
                            char_count=len(content),
                            checksum=_checksum(content),
                        )
                    )
                    idx += 1
            else:
                # Section too large — apply sliding window
                sub_chunks = self._sliding_window(section_body)
                for i, sub in enumerate(sub_chunks):
                    title = f"{section_title} (part {i + 1})" if i > 0 else section_title
                    content = sub.strip()
                    if content:
                        chunks.append(
                            Chunk(
                                title=title,
                                content=content,
                                chunk_index=idx,
                                char_count=len(content),
                                checksum=_checksum(content),
                            )
                        )
                        idx += 1

        return chunks

    # ── private ──────────────────────────────────────────────────────────────

    def _split_by_headings(
        self, text: str, document_title: str
    ) -> list[tuple[str, str]]:
        """
        Split text on H1/H2/H3 boundaries.

        Returns a list of (heading_title, body_text) tuples.
        Text before the first heading is emitted as a preamble section
        titled after the document.
        """
        matches = list(_HEADING_RE.finditer(text))
        if not matches:
            # No headings found — treat whole text as one section.
            return [(document_title or "Document", text)]

        sections: list[tuple[str, str]] = []

        # Preamble (text before the first heading)
        preamble = text[: matches[0].start()].strip()
        if preamble:
            sections.append((document_title or "Preamble", preamble))

        for i, match in enumerate(matches):
            heading_text = match.group(2).strip()
            body_start = match.end()
            body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            body = text[body_start:body_end].strip()
            if body:
                sections.append((heading_text, body))

        return sections

    def _sliding_window(self, text: str) -> list[str]:
        """
        Split ``text`` into overlapping windows of ``max_tokens`` tokens.

        Uses character-level approximation (1 token ≈ 4 chars).
        """
        max_chars = self.max_tokens * _CHARS_PER_TOKEN
        step_chars = (self.max_tokens - self.overlap_tokens) * _CHARS_PER_TOKEN

        if step_chars <= 0:
            step_chars = max_chars

        windows: list[str] = []
        start = 0
        while start < len(text):
            end = min(start + max_chars, len(text))
            window = text[start:end]
            windows.append(window)
            if end >= len(text):
                break
            start += step_chars

        return windows
