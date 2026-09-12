"""
ScraperService — extract clean markdown + screenshot from a client's website.

Uses Crawl4AI (async Playwright-based crawler) to render JavaScript-heavy
pages and produce LLM-ready markdown.  Falls back gracefully when Crawl4AI
is not installed or when the target site blocks headless browsers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import structlog

from app.config import settings

logger = structlog.get_logger()


@dataclass
class ScrapeResult:
    """Output of a website scrape operation."""

    url: str
    markdown: str
    screenshot_base64: str | None = None
    title: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    success: bool = True
    error: str | None = None


class ScraperService:
    """Extract markdown + screenshot from a client's website using Crawl4AI.

    All I/O is async.  The headless browser is spun up per-scrape and torn
    down immediately after, keeping idle memory near zero.
    """

    async def scrape(self, url: str) -> ScrapeResult:
        """Scrape a URL and return clean markdown + optional screenshot.

        Parameters
        ----------
        url:
            The target URL to scrape (e.g. ``"https://acme.ai"``).

        Returns
        -------
        ScrapeResult:
            Contains ``markdown`` (cleaned page content), ``screenshot_base64``
            (full-page PNG encoded as base64 string), and metadata.
        """
        try:
            return await self._scrape_with_crawl4ai(url)
        except ImportError:
            logger.warning(
                "crawl4ai_not_installed",
                hint="pip install crawl4ai to enable website scraping",
            )
            return await self._scrape_with_httpx(url)
        except Exception as exc:
            logger.error("scraper_service.scrape_failed", url=url, error=str(exc))
            return ScrapeResult(
                url=url,
                markdown="",
                success=False,
                error=str(exc),
            )

    async def _scrape_with_crawl4ai(self, url: str) -> ScrapeResult:
        """Primary path: full browser rendering + screenshot via Crawl4AI."""
        from crawl4ai import AsyncWebCrawler, CrawlerRunConfig  # noqa: PLC0415

        config = CrawlerRunConfig(
            screenshot=True,
            wait_until=settings.SCRAPER_WAIT_UNTIL,
            page_timeout=settings.SCRAPER_TIMEOUT_SECONDS * 1000,  # ms
        )

        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url, config=config)

        if not result.success:
            return ScrapeResult(
                url=url,
                markdown="",
                success=False,
                error=result.error_message or "Crawl4AI returned unsuccessful result",
            )

        screenshot_b64: str | None = None
        if result.screenshot:
            # Crawl4AI returns raw base64 string (no data: prefix)
            screenshot_b64 = result.screenshot

        logger.info(
            "scraper_service.crawl4ai_complete",
            url=url,
            markdown_len=len(result.markdown or ""),
            has_screenshot=screenshot_b64 is not None,
        )

        return ScrapeResult(
            url=url,
            markdown=result.markdown or "",
            screenshot_base64=screenshot_b64,
            title=getattr(result, "title", "") or "",
            metadata={
                "status_code": getattr(result, "status_code", None),
                "scraper": "crawl4ai",
            },
        )

    async def _scrape_with_httpx(self, url: str) -> ScrapeResult:
        """Lightweight fallback: HTTP fetch + basic HTML-to-text extraction.

        Used when Crawl4AI/Playwright is not installed.  Does not render
        JavaScript and cannot take screenshots, but still captures the
        raw HTML text content.
        """
        import httpx  # noqa: PLC0415

        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=settings.SCRAPER_TIMEOUT_SECONDS,
            ) as client:
                response = await client.get(url)
                response.raise_for_status()

            html = response.text
            markdown = self._html_to_basic_text(html)

            logger.info(
                "scraper_service.httpx_fallback_complete",
                url=url,
                markdown_len=len(markdown),
            )

            return ScrapeResult(
                url=url,
                markdown=markdown,
                screenshot_base64=None,  # no browser → no screenshot
                title=self._extract_title(html),
                metadata={
                    "status_code": response.status_code,
                    "scraper": "httpx_fallback",
                },
            )
        except Exception as exc:
            return ScrapeResult(
                url=url,
                markdown="",
                success=False,
                error=f"httpx fallback failed: {exc}",
            )

    @staticmethod
    def _html_to_basic_text(html: str) -> str:
        """Minimal HTML → plain text extraction without heavy dependencies."""
        import re  # noqa: PLC0415

        # Remove script and style blocks
        text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
        # Replace block-level tags with newlines
        text = re.sub(r"<(br|p|div|h[1-6]|li|tr)[^>]*>", "\n", text, flags=re.IGNORECASE)
        # Strip remaining tags
        text = re.sub(r"<[^>]+>", "", text)
        # Collapse whitespace
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        return text

    @staticmethod
    def _extract_title(html: str) -> str:
        """Extract <title> from raw HTML."""
        import re  # noqa: PLC0415

        match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else ""
