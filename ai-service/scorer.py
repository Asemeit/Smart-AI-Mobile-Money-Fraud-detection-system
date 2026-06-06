"""Rule-based scorer — mirror of backend logic for future ML replacement."""

import re

SUSPICIOUS = ["confirm", "pending", "click here", "verify now", "bit.ly", "tinyurl"]
PROVIDERS = ["mpesa", "mtn momo", "mtn mobile money", "airtel money"]


def _extract_amount(text: str):
    match = re.search(
        r"(?:ksh|ugx|rwf|tzs|kes)\s*([\d,]+(?:\.\d{2})?)", text, re.I
    ) or re.search(r"([\d,]+(?:\.\d{2})?)\s*(?:ksh|ugx|rwf|tzs)", text, re.I)
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def _extract_txn_id(text: str):
    match = re.search(
        r"(?:txn|transaction|ref|code)[:\s#]*([A-Z0-9]{6,12})", text, re.I
    ) or re.search(r"\b([A-Z0-9]{8,12})\b", text)
    return match.group(1).upper() if match else None


def score_message(message_text: str, provider: str | None = None, amount: float | None = None):
    text = (message_text or "").lower().strip()
    flags: list[str] = []
    risk = 0

    detected = next((p for p in PROVIDERS if p in text), None)
    if provider and detected and provider.lower() not in text:
        flags.append("Provider mismatch")
        risk += 25

    if not detected and not provider:
        flags.append("No recognized provider")
        risk += 20

    parsed_amount = _extract_amount(message_text)
    if amount and parsed_amount and abs(parsed_amount - amount) > 0.01:
        flags.append(f"Amount mismatch: {parsed_amount} vs {amount}")
        risk += 35

    if not _extract_txn_id(message_text):
        flags.append("No transaction ID detected")
        risk += 15

    for word in SUSPICIOUS:
        if word in text:
            flags.append(f'Suspicious phrase: "{word}"')
            risk += 10

    risk = min(100, risk)
    if risk >= 60:
        verdict = "HIGH_RISK"
    elif risk >= 30:
        verdict = "SUSPICIOUS"
    else:
        verdict = "LIKELY_GENUINE"

    return {
        "riskScore": risk,
        "verdict": verdict,
        "flags": flags,
        "parsed": {
            "amount": parsed_amount,
            "transactionId": _extract_txn_id(message_text),
            "provider": detected or provider,
        },
        "note": "Python AI service — replace with TensorFlow model",
    }
