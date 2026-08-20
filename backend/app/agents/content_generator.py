import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import LLMError
from app.tools.ai.llm_client import LLMClient
from app.tools.ai.rag_tool import RAGTool

PLATFORM_GUIDELINES = {
    "linkedin": (
        "Professional yet engaging tone. Use an arresting opening hook (1-2 lines), "
        "short paragraphs with whitespace, actionable insights, 3-5 relevant hashtags at the bottom, "
        "and a thought-provoking conversation starter CTA."
    ),
    "twitter": (
        "Punchy, high-impact hook within 280 characters or formatted as an engaging thread. "
        "Include 1-2 focused hashtags and a clear engagement CTA."
    ),
    "threads": (
        "Authentic, conversational tone. Focus on storytelling, personal lessons, "
        "and direct community questions."
    ),
    "instagram": (
        "Visual storytelling caption. Engaging hook, formatted bullets, high-value takeaway, "
        "and 5-10 targeted hashtags."
    ),
}


class ContentGeneratorAgent(BaseAgent):
    """Generates channel-tailored marketing posts grounded in brand knowledge."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        rag_tool: RAGTool | None = None,
        confidence_threshold: float = 0.85,
    ):
        super().__init__(name="ContentGeneratorAgent", confidence_threshold=confidence_threshold)
        self.llm = llm_client or LLMClient()
        self.rag = rag_tool

        # Template loader
        prompt_dir = Path(__file__).parent.parent / "prompts"
        self.jinja_env = Environment(loader=FileSystemLoader(str(prompt_dir)), autoescape=False)

    async def generate_post(
        self,
        brief: str,
        platform: str = "linkedin",
        tone: str = "professional",
        campaign_context: str | None = None,
    ) -> AgentResult:
        self.logger.info("generating_post", platform=platform, tone=tone, brief_len=len(brief))

        # Retrieve RAG context if RAG tool is available
        brand_context = ""
        rag_sources: list[str] = []
        if self.rag:
            try:
                retrieval = await self.rag.retrieve_context(query=brief, limit=3)
                brand_context = retrieval.context_text
                rag_sources = [f"doc_{doc.id}" for doc in retrieval.documents]
            except Exception as e:
                self.logger.warning("rag_retrieval_failed", error=str(e))

        platform_guide = PLATFORM_GUIDELINES.get(
            platform.lower(),
            "Professional, clear, engaging, and aligned with industry best practices.",
        )

        template = self.jinja_env.get_template("content_generation.j2")
        prompt = template.render(
            brief=brief,
            platform=platform,
            platform_guidelines=platform_guide,
            tone=tone,
            campaign_context=campaign_context,
            brand_context=brand_context,
        )

        try:
            llm_response = await self.llm.generate(
                prompt=prompt,
                temperature=0.7,
            )

            # Parse JSON output from LLM
            raw_text = llm_response.text.strip()
            # Clean possible markdown fence
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())
            content = parsed.get("content", raw_text)
            hashtags = parsed.get("hashtags", [])
            cta = parsed.get("cta", "")

            # Heuristic confidence calculation
            confidence = 0.90 if brand_context else 0.85
            if len(content) < 50:
                confidence -= 0.30

            success, requires_review = self.evaluate_confidence(confidence)

            return AgentResult(
                success=success,
                confidence_score=round(confidence, 2),
                requires_review=requires_review,
                data={
                    "content": content,
                    "hashtags": hashtags,
                    "cta": cta,
                    "platform": platform,
                    "tone": tone,
                    "tokens_used": llm_response.tokens_used,
                    "latency_ms": llm_response.latency_ms,
                    "rag_sources": rag_sources,
                },
                reasoning="Generated using Jinja2 prompt and RAG context."
            )
        except json.JSONDecodeError:
            # Fallback if raw text wasn't valid JSON
            return AgentResult(
                success=True,
                confidence_score=0.75,
                requires_review=True,
                data={
                    "content": llm_response.text,
                    "hashtags": [],
                    "cta": "",
                    "platform": platform,
                    "tone": tone,
                    "tokens_used": llm_response.tokens_used,
                    "latency_ms": llm_response.latency_ms,
                    "rag_sources": rag_sources,
                },
                reasoning="LLM output could not be strictly parsed as JSON; fallback text used."
            )
        except Exception as exc:
            self.logger.error("generation_failed", error=str(exc))
            raise LLMError(f"Content generation failed: {exc}") from exc
