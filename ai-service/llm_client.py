"""OpenRouter LLM client for fraud detection and financial advice."""

import os
import json
from typing import Optional
import httpx

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def is_configured() -> bool:
    """Check if OpenRouter API key is configured."""
    return bool(os.getenv("OPENROUTER_API_KEY"))


def get_model() -> str:
    """Get the configured OpenRouter model or default."""
    default = "google/gemma-2-9b-it:free"
    return os.getenv("OPENROUTER_MODEL", default)


def get_headers() -> dict:
    """Build OpenRouter request headers."""
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
    }
    
    # Optional OpenRouter metadata
    referer = os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:5173")
    if referer:
        headers["HTTP-Referer"] = referer
    
    app_title = os.getenv("OPENROUTER_APP_TITLE", "MoMo Fraud Detector")
    if app_title:
        headers["X-Title"] = app_title
    
    return headers


def call_openrouter(
    messages: list[dict],
    system: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    json_mode: bool = False,
) -> Optional[dict]:
    """Call OpenRouter API and return parsed response.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system: System prompt
        temperature: Sampling temperature
        max_tokens: Maximum tokens in response
        json_mode: If True, request structured JSON output
    
    Returns:
        Parsed response dict or None on failure
    """
    if not is_configured():
        return None

    try:
        request_body = {
            "model": get_model(),
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if system:
            request_body["messages"].insert(0, {"role": "system", "content": system})
        
        if json_mode:
            request_body["response_format"] = {"type": "json_object"}
        
        with httpx.Client(timeout=30) as client:
            response = client.post(
                OPENROUTER_API_URL,
                headers=get_headers(),
                json=request_body,
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get("choices") and len(data["choices"]) > 0:
                return data["choices"][0]["message"]
            return None
    except Exception as e:
        print(f"OpenRouter error: {e}")
        return None
