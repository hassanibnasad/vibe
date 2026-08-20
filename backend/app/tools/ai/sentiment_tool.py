import json

from pydantic import BaseModel

from app.tools.ai.llm_client import LLMClient


class SentimentResult(BaseModel):
    label: str  # positive, neutral, negative
    score: float  # -1.0 to 1.0


class SentimentTool:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    async def analyze(self, text: str) -> SentimentResult:
        prompt = f"""Classify the sentiment of this social media message as positive, neutral, or negative.
Message: "{text}"

Respond with ONLY valid JSON:
{{"label": "positive", "score": 0.8}}"""

        try:
            res = await self.llm.generate(prompt=prompt, temperature=0.1, max_tokens=50)
            data = json.loads(res.text)
            label = data.get("label", "neutral").lower()
            score = float(data.get("score", 0.0))
            return SentimentResult(label=label, score=score)
        except Exception:
            return SentimentResult(label="neutral", score=0.0)
