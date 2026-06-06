"""
Mobile Money Fraud Scoring Service — starter prototype.

TODO (AI team):
- Train TensorFlow model on labeled SMS datasets
- Add NLP feature extraction
- Support multi-language (Swahili, French, etc.)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scorer import score_message

app = FastAPI(title="MoMo Fraud AI Service", version="0.1.0")

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


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "model": "rule-based-v0"}


@app.post("/score")
def score(req: ScoreRequest):
    result = score_message(req.messageText, req.provider, req.amount)
    return {"source": "ai-service", **result}
