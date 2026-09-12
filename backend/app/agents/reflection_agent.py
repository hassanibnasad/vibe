"""
ReflectionAgent — analyze top-performing vs bottom-performing posts for a tenant
and extract reusable patterns into the brand's conversion playbook.
"""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from uuid import UUID

import structlog
from jinja2 import Environment, FileSystemLoader

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import LLMError
from app.repositories.brand_profile_repo import BrandProfileRepository
from app.repositories.performance_repo import PerformanceRepository
from app.repositories.post_repo import PostRepository
from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()


class ReflectionAgent(BaseAgent):
    """Analyze post conversion performance and refine the brand's playbook."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        confidence_threshold: float = 0.85,
        post_repo: PostRepository | None = None,
        performance_repo: PerformanceRepository | None = None,
        brand_profile_repo: BrandProfileRepository | None = None,
    ):
        super().__init__(name="ReflectionAgent", confidence_threshold=confidence_threshold)
        self.llm = llm_client or LLMClient()
        self.post_repo = post_repo
        self.performance_repo = performance_repo
        self.brand_profile_repo = brand_profile_repo

        prompt_dir = Path(__file__).parent.parent / "prompts"
        self.jinja_env = Environment(loader=FileSystemLoader(str(prompt_dir)), autoescape=False)

    async def reflect(
        self,
        tenant_id: UUID,
        since_days: int = 30,
        model: str | None = None,
    ) -> AgentResult:
        """Run performance reflection analysis for a given tenant.

        1. Load top-performing posts by conversion_score.
        2. Load bottom-performing posts.
        3. LLM analysis: contrast winners vs losers to extract patterns.
        4. Update BrandProfile.conversion_assets with winning hooks & CTAs.
        """
        self.logger.info("reflection.start", tenant_id=str(tenant_id), since_days=since_days)

        # ── Dependency resolution ────────────────────────────────────────────
        session_cm = None
        if not (self.post_repo and self.performance_repo and self.brand_profile_repo):
            from app.dependencies import get_sessionmaker  # noqa: PLC0415

            session_factory = get_sessionmaker()
            session_cm = session_factory()
            session = await session_cm.__aenter__()
            p_repo = self.post_repo or PostRepository(session)
            perf_repo = self.performance_repo or PerformanceRepository(session)
            bp_repo = self.brand_profile_repo or BrandProfileRepository(session)
        else:
            p_repo = self.post_repo
            perf_repo = self.performance_repo
            bp_repo = self.brand_profile_repo

        try:
            # ── 1. Fetch Brand Profile ────────────────────────────────────────
            brand_profile = await bp_repo.get_by_tenant(tenant_id)
            brand_name = brand_profile.brand_name if brand_profile else "Our Brand"

            # ── 2. Fetch Top and Bottom Performers ────────────────────────────
            top_records = await perf_repo.get_top_performers(
                tenant_id=tenant_id,
                limit=5,
                since=timedelta(days=since_days),
            )
            bottom_records = await perf_repo.get_bottom_performers(
                tenant_id=tenant_id,
                limit=5,
                since=timedelta(days=since_days),
            )

            if not top_records:
                self.logger.info("reflection.no_posts", tenant_id=str(tenant_id))
                return AgentResult(
                    success=True,
                    confidence_score=1.0,
                    requires_review=False,
                    data={
                        "message": "No scored performance records found for reflection.",
                        "winning_hooks": [],
                        "winning_ctas": [],
                        "dead_angles": [],
                        "actionable_takeaways": [],
                    },
                    reasoning="Insufficient telemetry data to run reflection.",
                )

            # ── 3. Hydrate Post Contents ──────────────────────────────────────
            top_posts_payload = []
            for r in top_records:
                post = await p_repo.get_by_id(r.post_id)
                if post and post.content:
                    top_posts_payload.append({
                        "content": post.content,
                        "conversion_score": r.conversion_score,
                        "platform": getattr(post, "platform", "social"),
                        "leads_generated": r.leads_generated,
                        "leads_qualified": r.leads_qualified,
                        "comments": r.comments,
                        "dms_initiated": r.dms_initiated,
                        "likes": r.likes,
                        "impressions": r.impressions,
                    })

            bottom_posts_payload = []
            for r in bottom_records:
                post = await p_repo.get_by_id(r.post_id)
                if post and post.content:
                    bottom_posts_payload.append({
                        "content": post.content,
                        "conversion_score": r.conversion_score,
                        "platform": getattr(post, "platform", "social"),
                        "leads_generated": r.leads_generated,
                        "dms_initiated": r.dms_initiated,
                        "impressions": r.impressions,
                    })

            # ── 4. Render Prompt and Call LLM ─────────────────────────────────
            template = self.jinja_env.get_template("reflection.j2")
            prompt = template.render(
                brand_name=brand_name,
                top_posts=top_posts_payload,
                bottom_posts=bottom_posts_payload,
            )

            llm_response = await self.llm.generate(
                prompt=prompt,
                model=model,
                temperature=0.3,
            )

            raw_text = llm_response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())
            winning_hooks: list[str] = parsed.get("winning_hooks", [])
            winning_ctas: list[str] = parsed.get("winning_ctas", [])
            dead_angles: list[str] = parsed.get("dead_angles", [])
            actionable_takeaways: list[str] = parsed.get("actionable_takeaways", [])
            summary: str = parsed.get("summary", "")

            # ── 5. Update BrandProfile Conversion Assets ──────────────────────
            if brand_profile:
                assets = dict(brand_profile.conversion_assets or {})
                offer_hooks = list(assets.get("offer_hooks", []))
                for hook in winning_hooks:
                    if hook not in offer_hooks:
                        offer_hooks.append(hook)

                cta_templates = list(assets.get("cta_templates", []))
                for cta in winning_ctas:
                    if cta not in cta_templates:
                        cta_templates.append(cta)

                assets["offer_hooks"] = offer_hooks
                assets["cta_templates"] = cta_templates
                assets["dead_angles"] = dead_angles
                assets["latest_reflection_summary"] = summary

                await bp_repo.upsert(
                    tenant_id=tenant_id,
                    conversion_assets=assets,
                )

            return AgentResult(
                success=True,
                confidence_score=0.92,
                requires_review=False,
                data={
                    "winning_hooks": winning_hooks,
                    "winning_ctas": winning_ctas,
                    "dead_angles": dead_angles,
                    "actionable_takeaways": actionable_takeaways,
                    "summary": summary,
                    "top_posts_analyzed": len(top_posts_payload),
                    "bottom_posts_analyzed": len(bottom_posts_payload),
                },
                reasoning="Reflection completed successfully; BrandProfile updated with winning patterns.",
            )

        except json.JSONDecodeError as err:
            self.logger.error("reflection.json_parse_error", error=str(err))
            return AgentResult(
                success=False,
                confidence_score=0.5,
                requires_review=True,
                data={"raw_output": raw_text if "raw_text" in locals() else ""},
                error=f"Failed to parse LLM reflection output: {err}",
            )
        except Exception as exc:
            self.logger.error("reflection.failed", error=str(exc))
            raise LLMError(f"Reflection agent failed: {exc}") from exc
        finally:
            if session_cm:
                await session_cm.__aexit__(None, None, None)
