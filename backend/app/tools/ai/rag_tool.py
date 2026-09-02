"""
Enterprise-grade RAG retrieval pipeline.

Two-phase architecture:
  Phase 1 — Vector candidate retrieval:
    KnowledgeRepository.vector_search() fetches top-k candidates via
    HNSW cosine distance (pgvector).  Produces a broad, recall-optimised set.

  Phase 2 — Cross-encoder re-ranking (optional, enabled by default):
    CrossEncoderReranker uses the fast LLM (8B) to score every (query, chunk)
    pair in a single batched prompt and re-orders by relevance.
    This eliminates false positives that pass the vector similarity threshold
    but are semantically unrelated to the exact query.

  Phase 3 — Context assembly:
    ContextAssembler trims the top-n results to fit within a configurable
    token budget (default 2000 tokens) and formats them into a structured
    grounding block suitable for injection into a generation prompt.
"""

from __future__ import annotations

import json
import re
from typing import Any

import structlog

from app.config import settings
from app.repositories.knowledge_repo import KnowledgeRepository
from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()

# Character-to-token approximation for context budget enforcement.
_CHARS_PER_TOKEN = 4


# ── Data models ───────────────────────────────────────────────────────────────


class RAGResult:
    """
    Output of a complete retrieval pipeline run.

    Attributes
    ----------
    documents:
        Re-ranked (or vector-sorted) document dicts, each containing
        ``id``, ``title``, ``content``, ``doc_type``, ``similarity``,
        and optionally ``rerank_score``.
    formatted_text:
        Ready-to-inject context string for LLM prompts.
    top_score:
        Highest similarity/rerank score across all documents.
    rerank_scores:
        Parallel list of re-rank scores (empty when re-ranking is disabled).
    token_budget_used:
        Approximate tokens consumed by ``formatted_text``.
    """

    def __init__(
        self,
        documents: list[dict[str, Any]],
        formatted_text: str,
        top_score: float,
        rerank_scores: list[float] | None = None,
    ) -> None:
        self.documents = documents
        self.formatted_text = formatted_text
        self.top_score = top_score
        self.rerank_scores = rerank_scores or []
        self.token_budget_used = len(formatted_text) // _CHARS_PER_TOKEN

    @property
    def context_text(self) -> str:
        """Alias kept for backward compatibility with existing agent code."""
        return self.formatted_text

    def __bool__(self) -> bool:
        return bool(self.documents)


# ── Cross-encoder re-ranker ───────────────────────────────────────────────────


class CrossEncoderReranker:
    """
    Re-rank a list of candidate documents against a query using the fast LLM.

    Issues a single batched prompt listing all candidates and asks the model
    to return a relevance score (0.0–1.0) per chunk.  This is significantly
    cheaper than N individual calls because it uses one forward pass.

    Falls back to the original vector-similarity ordering on any parse error.
    """

    _SYSTEM_PROMPT = (
        "You are a relevance scoring engine.  "
        "You receive a query and a numbered list of text chunks.  "
        "For each chunk, output ONLY a JSON array of floating-point relevance scores "
        "between 0.0 (completely irrelevant) and 1.0 (perfectly relevant).  "
        "The array must have exactly one score per chunk, in the same order.  "
        "Do not include any explanation or extra text."
    )

    def __init__(self, llm_client: LLMClient) -> None:
        self._llm = llm_client

    async def rerank(
        self,
        query: str,
        candidates: list[dict[str, Any]],
        top_n: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Score and sort ``candidates`` by relevance to ``query``.

        Parameters
        ----------
        query:
            The user query / brief used as the retrieval anchor.
        candidates:
            Documents from the vector search phase.  Each dict must have
            at least ``title`` and ``content`` keys.
        top_n:
            How many documents to return after re-ranking.

        Returns
        -------
        list[dict]:
            Top-n documents sorted by ``rerank_score`` descending,
            with the score injected as a new ``rerank_score`` key.
        """
        if not candidates:
            return []

        numbered = "\n\n".join(
            f"[{i + 1}] {doc.get('title', 'Untitled')}:\n{doc.get('content', '')[:600]}"
            for i, doc in enumerate(candidates)
        )
        prompt = (
            f"Query: {query}\n\n"
            f"Chunks to score (output a JSON array of {len(candidates)} floats):\n\n"
            f"{numbered}"
        )

        try:
            response = await self._llm.generate(
                prompt=prompt,
                model="fast",  # 8B model — fast, no need for 70B for scoring
                system_prompt=self._SYSTEM_PROMPT,
                temperature=0.0,
                max_tokens=256,
                allow_fallback=False,
            )
            scores = self._parse_scores(response.text, expected_count=len(candidates))
        except Exception as exc:
            logger.warning(
                "rag_reranker.fallback_to_vector_order",
                error=str(exc),
                query=query[:100],
            )
            # Fallback: use similarity scores as rerank scores
            scores = [doc.get("similarity", 0.0) for doc in candidates]

        # Attach scores and sort
        scored = sorted(
            [
                {**doc, "rerank_score": float(score)}
                for doc, score in zip(candidates, scores)
            ],
            key=lambda d: d["rerank_score"],
            reverse=True,
        )

        logger.debug(
            "rag_reranker.complete",
            candidates=len(candidates),
            top_n=top_n,
            top_score=scored[0]["rerank_score"] if scored else 0.0,
        )

        return scored[:top_n]

    @staticmethod
    def _parse_scores(text: str, expected_count: int) -> list[float]:
        """Extract a JSON float array from the model response."""
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?|```", "", text).strip()
        # Find the first JSON array
        match = re.search(r"\[[\d.,\s]+\]", cleaned)
        if not match:
            raise ValueError(f"No float array found in reranker response: {text[:200]!r}")
        scores = json.loads(match.group())
        if len(scores) != expected_count:
            raise ValueError(
                f"Expected {expected_count} scores, got {len(scores)}: {scores}"
            )
        return [float(s) for s in scores]


# ── Context assembler ─────────────────────────────────────────────────────────


class ContextAssembler:
    """
    Trim re-ranked documents to a token budget and format them into a
    structured grounding block for injection into an LLM prompt.

    Format:
        [DOC_TYPE] Title:
        ...chunk content...

        ---

        [DOC_TYPE] Title:
        ...
    """

    def __init__(self, max_tokens: int = 2000) -> None:
        self.max_tokens = max_tokens
        self._max_chars = max_tokens * _CHARS_PER_TOKEN

    def assemble(self, documents: list[dict[str, Any]]) -> str:
        """
        Select as many documents as fit within the token budget (in rank order)
        and format them into a grounding block.
        """
        sections: list[str] = []
        chars_used = 0

        for doc in documents:
            doc_type_label = doc.get("doc_type", "GENERAL").upper()
            title = doc.get("title", "Untitled")
            content = doc.get("content", "")
            section = f"[{doc_type_label}] {title}:\n{content}"
            section_chars = len(section)

            if chars_used + section_chars > self._max_chars:
                # Try to fit a truncated version of the last section
                remaining = self._max_chars - chars_used
                if remaining > 200:  # Only include if meaningful content remains
                    truncated = section[:remaining] + "\n[...truncated]"
                    sections.append(truncated)
                break

            sections.append(section)
            chars_used += section_chars

        return "\n\n---\n\n".join(sections)


# ── Public RAGTool ────────────────────────────────────────────────────────────


class RAGTool:
    """
    Two-phase knowledge retrieval pipeline:
    1. Vector candidate retrieval (pgvector HNSW cosine search)
    2. Cross-encoder re-ranking via fast LLM (optional)
    3. Context assembly with token-budget enforcement
    """

    def __init__(self, knowledge_repo: KnowledgeRepository, llm_client: LLMClient) -> None:
        self.repo = knowledge_repo
        self.llm = llm_client
        self._reranker = CrossEncoderReranker(llm_client)
        self._assembler = ContextAssembler(max_tokens=settings.RAG_MAX_CONTEXT_TOKENS)

    async def search(
        self,
        query: str,
        doc_types: list[str] | None = None,
        top_k: int | None = None,
        top_n: int | None = None,
        similarity_threshold: float | None = None,
        max_tokens: int | None = None,
        rerank: bool | None = None,
    ) -> RAGResult:
        """
        Full retrieval pipeline: embed → vector search → (re-rank) → assemble.

        Parameters
        ----------
        query:
            Natural-language query to retrieve against.
        doc_types:
            Restrict retrieval to specific doc_type values.
        top_k:
            Number of candidates to pull from vector search (defaults to
            ``settings.RAG_TOP_K``).
        top_n:
            Number of final results after re-ranking (defaults to
            ``settings.RAG_TOP_N``).
        similarity_threshold:
            Minimum cosine similarity for a candidate to qualify.
        max_tokens:
            Context window token budget (defaults to
            ``settings.RAG_MAX_CONTEXT_TOKENS``).
        rerank:
            Whether to run the cross-encoder re-ranker.  Defaults to
            ``settings.RAG_RERANK_ENABLED``.  Set to ``False`` for
            latency-sensitive paths (e.g. streaming replies).
        """
        _top_k = top_k if top_k is not None else settings.RAG_TOP_K
        _top_n = top_n if top_n is not None else settings.RAG_TOP_N
        _threshold = similarity_threshold if similarity_threshold is not None else settings.RAG_SIMILARITY_THRESHOLD
        _rerank = rerank if rerank is not None else settings.RAG_RERANK_ENABLED
        _max_tokens = max_tokens if max_tokens is not None else settings.RAG_MAX_CONTEXT_TOKENS

        # Phase 1 — Vector candidate retrieval
        query_embedding = await self.llm.embed(query)
        candidates = await self.repo.vector_search(
            query_embedding=query_embedding,
            doc_types=doc_types,
            limit=_top_k,
            similarity_threshold=_threshold,
        )

        logger.debug(
            "rag_tool.vector_search_complete",
            query=query[:80],
            candidates=len(candidates),
            top_k=_top_k,
        )

        if not candidates:
            return RAGResult(documents=[], formatted_text="", top_score=0.0)

        # Phase 2 — Cross-encoder re-ranking
        rerank_scores: list[float] = []
        if _rerank and len(candidates) > 1:
            ranked = await self._reranker.rerank(
                query=query, candidates=candidates, top_n=_top_n
            )
            rerank_scores = [d["rerank_score"] for d in ranked]
        else:
            # No re-ranking: just take top-n by vector similarity
            ranked = candidates[:_top_n]

        # Phase 3 — Context assembly
        assembler = ContextAssembler(max_tokens=_max_tokens)
        formatted_text = assembler.assemble(ranked)
        top_score = (
            ranked[0].get("rerank_score", ranked[0].get("similarity", 0.0))
            if ranked
            else 0.0
        )

        logger.info(
            "rag_tool.search_complete",
            query=query[:80],
            candidates=len(candidates),
            returned=len(ranked),
            top_score=round(top_score, 4),
            reranked=_rerank,
            token_budget_used=len(formatted_text) // _CHARS_PER_TOKEN,
        )

        return RAGResult(
            documents=ranked,
            formatted_text=formatted_text,
            top_score=top_score,
            rerank_scores=rerank_scores,
        )

    async def retrieve_context(
        self,
        query: str,
        doc_types: list[str] | None = None,
        limit: int = 3,
        similarity_threshold: float = 0.3,
    ) -> RAGResult:
        """
        Backward-compatible alias used by existing agent code.

        Maps old ``limit`` parameter to ``top_n``; re-ranking is enabled
        by default (honours ``settings.RAG_RERANK_ENABLED``).
        """
        return await self.search(
            query=query,
            doc_types=doc_types,
            top_n=limit,
            similarity_threshold=similarity_threshold,
        )
