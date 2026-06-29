"""
Mobile Money Fraud Scoring Service.

Uses OpenRouter LLM when configured; falls back to rule-based scoring otherwise.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from advisor import chat_with_llm
from llm_client import get_model, is_configured
from llm_scorer import score_with_llm
from scorer import score_message

load_dotenv()

app = FastAPI(title="MoMo Fraud AI Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScoreRequest(BaseModel):
    messageText: str
    provider: str | None = None
    amount: float | None = None


class AdvisorRequest(BaseModel):
    message: str


def _active_engine() -> str:
    return f"openrouter:{get_model()}" if is_configured() else "rule-based"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-service",
        "engine": _active_engine(),
        "llmConfigured": is_configured(),
    }


@app.post("/score")
def score(req: ScoreRequest):
    if is_configured():
        result = score_with_llm(req.messageText, req.provider, req.amount)
    else:
        result = score_message(req.messageText, req.provider, req.amount)

    return {"source": "ai-service", **result}


@app.post("/advisor/chat")
def advisor_chat(req: AdvisorRequest):
    if not req.message.strip():
        return {"error": "message is required"}

    if is_configured():
        return {"source": "ai-service", **chat_with_llm(req.message)}

    return {
        "source": "ai-service",
        "reply": (
            "I can help with saving, budgeting, and mobile money safety. "
            "Configure OPENROUTER_API_KEY to enable full AI responses."
        ),
        "category": "financial-advice",
        "disclaimer": "General guidance only — not professional financial advice.",
    }
