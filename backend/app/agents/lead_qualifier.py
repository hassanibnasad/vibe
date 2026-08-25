import json
from pathlib import Path
from typing import Any
import uuid

from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.agents.base import AgentResult, BaseAgent
from app.exceptions import LLMError, LeadNotFoundError
from app.models.enums import LeadStage, calculate_lead_stage
from app.models.lead import Lead
from app.models.lead_field_history import LeadFieldHistory
from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()

# Backward compatible alias
calculate_stage = calculate_lead_stage


class BantExtraction(BaseModel):
    """LLM Structured Output for BANT extraction."""
    extracted_budget: dict[str, Any] | None = Field(
        None, description="Format: {'amount': 5000, 'currency': 'USD', 'notes': 'per month'}"
    )
    extracted_authority: dict[str, Any] | None = Field(
        None, description="Format: {'role': 'CTO', 'is_decision_maker': true}"
    )
    extracted_need: dict[str, Any] | None = Field(
        None, description="Format: {'core_problem': 'needs automated marketing'}"
    )
    extracted_timeline: dict[str, Any] | None = Field(
        None, description="Format: {'timeframe': 'Q3', 'urgency': 'high'}"
    )


def compute_bant_score(lead_or_dict: Lead | dict) -> int:
    """Deterministic score calculation based on verified BANT criteria."""
    score = 0
    if isinstance(lead_or_dict, dict):
        if lead_or_dict.get("budget"):
            score += 25
        if lead_or_dict.get("authority"):
            score += 25
        if lead_or_dict.get("need"):
            score += 25
        if lead_or_dict.get("timeline"):
            score += 25
    else:
        if lead_or_dict.budget:
            score += 25
        if lead_or_dict.authority:
            score += 25
        if lead_or_dict.need:
            score += 25
        if lead_or_dict.timeline:
            score += 25
    return score


class LeadQualifierAgent(BaseAgent):
    """Pure reasoning agent for structured BANT memory extraction and heuristic lead qualification."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        confidence_threshold: float = 0.80,
    ):
        super().__init__(name="LeadQualifierAgent", confidence_threshold=confidence_threshold)
        self.llm = llm_client or LLMClient()

        prompt_dir = Path(__file__).parent.parent / "prompts"
        self.jinja_env = Environment(loader=FileSystemLoader(str(prompt_dir)), autoescape=False)

    async def extract_bant_facts(
        self,
        current_state: dict[str, Any],
        new_user_message: str,
    ) -> AgentResult:
        """Pure reasoning seam: Extract BANT facts from user message against current memory state."""
        self.logger.info("extracting_bant_facts", msg_len=len(new_user_message))

        system_prompt = f"""
You are a lead qualification extraction engine. Analyze the user's latest message.
Only extract new facts that UPDATE or ADD to the current known BANT state.
Respond ONLY in valid JSON matching the BantExtraction schema.

CURRENT KNOWN STATE:
Budget: {current_state.get('budget') or 'Unknown'}
Authority: {current_state.get('authority') or 'Unknown'}
Need: {current_state.get('need') or 'Unknown'}
Timeline: {current_state.get('timeline') or 'Unknown'}
"""
        try:
            extraction, llm_resp = await self.llm.generate_structured(
                prompt=new_user_message,
                schema=BantExtraction,
                system_prompt=system_prompt,
                temperature=0.1,
            )
        except Exception as exc:
            self.logger.warning("structured_extraction_fallback", error=str(exc))
            extraction = BantExtraction()
            llm_resp = None

        # Compute field updates
        changes: dict[str, dict[str, Any]] = {}
        updated_state = dict(current_state)

        for field in ["budget", "authority", "need", "timeline"]:
            new_val = getattr(extraction, f"extracted_{field}")
            if new_val:
                old_val = current_state.get(field)
                if old_val != new_val:
                    changes[field] = {"old": old_val, "new": new_val}
                    updated_state[field] = new_val

        is_qualified = bool(
            updated_state.get("budget")
            and updated_state.get("authority")
            and updated_state.get("need")
            and updated_state.get("timeline")
        )
        new_score = compute_bant_score(updated_state)
        new_stage = calculate_lead_stage(new_score)

        return AgentResult(
            success=True,
            confidence_score=0.90,
            requires_review=False,
            data={
                "changes": changes,
                "updated_state": updated_state,
                "is_qualified": is_qualified,
                "new_score": new_score,
                "new_stage": new_stage,
                "extraction": extraction.model_dump(),
            },
            reasoning=f"Extracted {len(changes)} updated BANT fields.",
        )

    async def process_lead_turn(
        self,
        db_session: AsyncSession,
        lead_id: uuid.UUID,
        new_user_message: str,
    ) -> tuple[Lead, list[LeadFieldHistory]]:
        """Process incoming user turn against working memory state and persist diffs."""
        self.logger.info("processing_lead_turn", lead_id=str(lead_id))

        # 1. Fetch current lead state
        lead = await db_session.get(Lead, lead_id)
        if not lead:
            raise LeadNotFoundError(f"Lead {lead_id} not found")

        current_state = {
            "budget": lead.budget,
            "authority": lead.authority,
            "need": lead.need,
            "timeline": lead.timeline,
        }

        # 2. Pure extraction seam
        result = await self.extract_bant_facts(current_state=current_state, new_user_message=new_user_message)
        changes = result.data.get("changes", {})

        history_records: list[LeadFieldHistory] = []
        for field, diff in changes.items():
            history_record = LeadFieldHistory(
                tenant_id=lead.tenant_id,
                lead_id=lead.id,
                field=field,
                old_value=diff["old"],
                new_value=diff["new"],
            )
            db_session.add(history_record)
            history_records.append(history_record)
            setattr(lead, field, diff["new"])

        lead.is_qualified = result.data["is_qualified"]
        lead.lead_score = result.data["new_score"]
        lead.lead_stage = result.data["new_stage"]

        if changes:
            await db_session.commit()
            await db_session.refresh(lead)

        return lead, history_records

    async def qualify_lead(
        self,
        lead_name: str | None,
        lead_company: str | None,
        lead_job_title: str | None,
        current_score: int,
        conversation_history: list[dict],
    ) -> AgentResult:
        """Heuristic BANT evaluation method for multi-turn scoring pipelines."""
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
            new_stage = calculate_lead_stage(new_score)

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
            score_delta = 5
            new_score = min(100, current_score + score_delta)
            new_stage = calculate_lead_stage(new_score)
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
