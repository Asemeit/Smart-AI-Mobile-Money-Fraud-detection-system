"""LLM-powered financial advisor via OpenRouter."""

from typing import Optional
from llm_client import call_openrouter


STATIC_TIPS = {
    "saving": "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Start small — even 500 UGX daily adds up.",
    "budget": "Track every mobile money payment for one week. Most traders find 2–3 recurring leaks they can fix.",
    "fraud": "Always confirm payment in your official M-Pesa or MoMo app — never trust SMS alone. Check sender number and transaction ID.",
    "default": "I can help with saving tips, budgeting, and spotting risky transactions. What would you like to know?",
}


def _pick_static_response(message: str) -> str:
    """Fallback: pick a static tip based on keyword matching."""
    text = (message or "").lower()
    if "save" in text or "saving" in text:
        return STATIC_TIPS["saving"]
    if "budget" in text or "spend" in text or "cost" in text:
        return STATIC_TIPS["budget"]
    if "fraud" in text or "scam" in text or "fake" in text or "suspicious" in text:
        return STATIC_TIPS["fraud"]
    return STATIC_TIPS["default"]


def chat_with_llm(user_message: str) -> dict:
    """Generate financial advice using OpenRouter LLM, with fallback to static tips.
    
    Returns a dict with:
    {
        "reply": str (the advice),
        "category": str (e.g. "financial-advice"),
        "disclaimer": str
    }
    """
    system_prompt = """You are a friendly financial advisor for mobile money traders in East Africa (Uganda, Kenya, Tanzania, Rwanda).

Your expertise:
- Saving strategies for small traders (daily/weekly budgeting with limited income)
- Mobile money security (M-Pesa, MTN MoMo, Airtel Money)
- Fraud awareness and prevention
- Budgeting tips for traders managing cash flow

Tone: Conversational, practical, empathetic. Avoid jargon. Keep responses under 150 words.
Always include a brief reminder that this is general guidance, not professional financial advice.
Focus on actionable advice traders can apply today."""

    messages = [{"role": "user", "content": user_message}]
    
    response = call_openrouter(
        messages=messages,
        system=system_prompt,
        temperature=0.7,
        max_tokens=300,
    )
    
    if not response or not response.get("content"):
        # Fallback to static tips
        return {
            "reply": _pick_static_response(user_message),
            "category": "financial-advice",
            "disclaimer": "General guidance only — not professional financial advice.",
            "note": "Static fallback (LLM unavailable)",
        }
    
    reply = response.get("content", "").strip()
    
    # Ensure disclaimer is present
    if "not professional" not in reply.lower() and "not financial advice" not in reply.lower():
        reply += "\n\n*This is general guidance only — not professional financial advice.*"
    
    return {
        "reply": reply,
        "category": "financial-advice",
        "disclaimer": "General guidance only — not professional financial advice.",
    }
