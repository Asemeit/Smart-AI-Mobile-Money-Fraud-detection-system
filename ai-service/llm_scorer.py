"""LLM-powered fraud scoring via OpenRouter."""

import json
from typing import Optional
from llm_client import call_openrouter
from scorer import score_message


def score_with_llm(
    message_text: str,
    provider: Optional[str] = None,
    amount: Optional[float] = None,
) -> dict:
    """Score a mobile money message using OpenRouter LLM, with fallback to rule-based scoring.
    
    Returns a dict matching the expected response shape:
    {
        "riskScore": int (0-100),
        "verdict": str (LIKELY_GENUINE|SUSPICIOUS|HIGH_RISK),
        "flags": list[str],
        "parsed": {
            "amount": float or None,
            "transactionId": str or None,
            "provider": str or None
        },
        "note": str
    }
    """
    system_prompt = """You are an expert fraud detection analyst for mobile money services (M-Pesa, MTN MoMo, Airtel Money).

Analyze the provided SMS/receipt text and return a structured JSON assessment. Consider:
- Provider format consistency (real M-Pesa/MTN MoMo messages have specific formatting)
- Suspicious phrases (confirm, pending, click here, verify now, short links like bit.ly/tinyurl)
- Transaction ID presence and format
- Amount consistency with reported value
- Social engineering patterns (urgency, authority impersonation, unusual requests)

Return ONLY valid JSON with this exact structure:
{
    "riskScore": <0-100 integer>,
    "verdict": "<LIKELY_GENUINE|SUSPICIOUS|HIGH_RISK>",
    "flags": [<list of detected issues>],
    "parsed": {
        "amount": <extracted amount or null>,
        "transactionId": <extracted ID or null>,
        "provider": "<normalized provider name or null>"
    }
}

Risk score guidelines:
- 0-29: LIKELY_GENUINE (authentic-looking messages with proper formatting)
- 30-59: SUSPICIOUS (minor red flags, format oddities, or ambiguous signals)
- 60-100: HIGH_RISK (multiple fraud indicators, phishing patterns, social engineering)
"""
    
    user_message = f"""Analyze this mobile money message for fraud risk.
Reported provider: {provider or "not specified"}
Expected amount: {amount or "not specified"}

Message text:
{message_text}"""
    
    messages = [{"role": "user", "content": user_message}]
    
    response = call_openrouter(
        messages=messages,
        system=system_prompt,
        temperature=0.3,  # Low temperature for consistent scoring
        max_tokens=500,
        json_mode=True,
    )
    
    if not response:
        # Fallback to rule-based scorer
        return {
            **score_message(message_text, provider, amount),
            "note": "Fallback to rule-based scoring (LLM unavailable)",
        }
    
    try:
        # Parse LLM response
        content = response.get("content", "")
        if isinstance(content, str):
            # Clean up potential markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            
            result = json.loads(content)
        else:
            result = content
        
        # Validate and normalize response
        result["riskScore"] = max(0, min(100, int(result.get("riskScore", 0))))
        result["verdict"] = result.get("verdict", "SUSPICIOUS")
        result["flags"] = result.get("flags", [])
        result["parsed"] = result.get("parsed", {})
        
        return result
    except json.JSONDecodeError:
        # Fallback if LLM returns invalid JSON
        return {
            **score_message(message_text, provider, amount),
            "note": "Fallback to rule-based scoring (LLM response parsing failed)",
        }
