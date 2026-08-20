import json
from pathlib import Path
import structlog
from jinja2 import Environment, FileSystemLoader

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import LLMError
from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()


def calculate_stage(score: int) -> str:
    """Standard CRM BANT Lead Funnel Stage mapping."""
    if score >= 90:
        return "sql"
    elif score >= 75:
        return "mql"
    elif score >= 50:
        return "hot"
    elif score >= 20:
        return "warm"
    return "cold"


class LeadQualifierAgent(BaseAgent):
    """Evaluates lead engagement and conversation context to score leads according to BANT criteria."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        confidence_threshold: float = 0.80,
    ):
        super().__init__(name="LeadQualifierAgent", confidence_threshold=confidence_threshold)
        self.llm = llm_client or LLMClient()

        prompt_dir = Path(__file__).parent.parent / "prompts"
        self.jinja_env = Environment(loader=FileSystemLoader(str(prompt_dir)), autoescape=False)

    async def qualify_lead(
        self,
        lead_name: str | None,
        lead_company: str | None,
        lead_job_title: str | None,
        current_score: int,
        conversation_history: list[dict],
    ) -> AgentResult:
        self.logger.info("evaluating_lead_qualification", name=lead_name, current_score=current_score)

        template = self.jinja_env.get_template("lead_scoring.j2")
        prompt = template.render(
            lead_name=lead_name or "Unknown",
            lead_company=lead_company or "Unknown",
            lead_job_title=lead_job_title or "Professional",
            current_score=current_score,
            conversation_history=conversation_history,
        )

        try:
            llm_response = await self.llm.generate(
                prompt=prompt,
                temperature=0.2,
                max_tokens=300,
            )

            raw_text = llm_response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())
            score_delta = int(parsed.get("score_delta", 5))
            pain_points = parsed.get("pain_points", [])
            interests = parsed.get("interests", [])
            reason = parsed.get("reason", "Conversation evaluation")

            new_score = max(0, min(100, current_score + score_delta))
            new_stage = calculate_stage(new_score)

            return AgentResult(
                success=True,
                confidence_score=0.90,
                requires_review=False,
                data={
                    "old_score": current_score,
                    "new_score": new_score,
                    "score_delta": score_delta,
                    "new_stage": new_stage,
                    "pain_points": pain_points,
                    "interests": interests,
                    "reason": reason,
                },
                reasoning=reason,
            )

        except (json.JSONDecodeError, ValueError):
            # Fallback heuristic if LLM output failed JSON decode
            score_delta = 5
            new_score = min(100, current_score + score_delta)
            new_stage = calculate_stage(new_score)
            return AgentResult(
                success=True,
                confidence_score=0.70,
                requires_review=False,
                data={
                    "old_score": current_score,
                    "new_score": new_score,
                    "score_delta": score_delta,
                    "new_stage": new_stage,
                    "pain_points": [],
                    "interests": [],
                    "reason": "Default increment on active multi-turn interaction.",
                },
                reasoning="Fallback heuristic applied.",
            )
        except Exception as exc:
            self.logger.error("lead_qualification_failed", error=str(exc))
            raise LLMError(f"Lead qualification failed: {exc}") from exc
