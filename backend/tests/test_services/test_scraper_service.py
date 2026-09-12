from unittest.mock import AsyncMock, patch

import pytest

from app.services.scraper_service import ScraperService


@pytest.mark.asyncio
async def test_scraper_service_httpx_fallback():
    service = ScraperService()

    mock_html = """
    <html>
        <head><title>Acme AI Platform</title></head>
        <body>
            <h1>Welcome to Acme AI</h1>
            <p>We build autonomous workflows for enterprise marketing teams.</p>
        </body>
    </html>
    """

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.text = mock_html
    mock_response.raise_for_status = lambda: None

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        result = await service._scrape_with_httpx("https://acme.ai")

    assert result.success is True
    assert "Acme AI" in result.markdown
    assert result.url == "https://acme.ai"
    assert result.title == "Acme AI Platform"


@pytest.mark.asyncio
async def test_scraper_service_scrape_exception_handling():
    service = ScraperService()

    with patch.object(service, "_scrape_with_crawl4ai", side_effect=Exception("Connection refused")):
        result = await service.scrape("https://invalid-url-12345.com")

    assert result.success is False
    assert "Connection refused" in (result.error or "")
