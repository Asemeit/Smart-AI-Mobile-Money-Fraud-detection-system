# AI Components Report

This document describes how and where AI components fit into the **Smart AI Mobile Money Fraud Detection System** — covering the current codebase and the planned OpenRouter LLM integration.

---

## Summary

The project is built around AI-powered fraud detection and financial guidance. **Today**, both features rely on **rule-based / keyword logic**. The planned approach is to integrate an **LLM via the [OpenRouter](https://openrouter.ai/) API** for all intelligent analysis — receipt verification and the financial advisor. There is **no machine learning or custom model training**; all AI capabilities come from LLM calls through OpenRouter.

---

## AI Strategy

OpenRouter provides unified access to multiple LLM providers through a single API. The AI service and backend will call OpenRouter to power both core AI features:

| Feature | LLM role |
|---------|----------|
| **Receipt verification** | Analyze SMS text for fraud signals — suspicious phrasing, format anomalies, provider mismatches, and social-engineering patterns — and return a structured risk assessment (`riskScore`, `verdict`, `flags`, `parsed`) matching the existing API contract |
| **Financial advisor** | Generate contextual, conversational guidance on saving, budgeting, and fraud awareness in response to user questions |

**Why OpenRouter:**

- Intelligent analysis of varied SMS formats and natural language across providers (M-Pesa, MTN MoMo, Airtel Money)
- Supports multi-language messages (English, Swahili, French) out of the box
- Single API for access to multiple LLM providers and models
- Keeps the existing backend proxy pattern (`AI_SERVICE_URL` → `/score`) unchanged

**Configuration (planned):**

- `OPENROUTER_API_KEY` — API key stored in environment variables, never committed to the repo
- `OPENROUTER_MODEL` — model identifier on OpenRouter (e.g. a cost-effective instruction-following model suitable for structured JSON output)

**Fallback behavior:**

- If the OpenRouter call fails or times out, the system falls back to the existing rule engine in `fraudScorer.js` / `scorer.py`
- The rule engine remains available as a safety net when the LLM is unavailable

The `/score` and `/advisor/chat` API contracts stay the same, so the Express backend and React frontend require no structural changes.

---

## Architecture Overview

### Current (rule-based)

```
┌─────────────┐     REST      ┌─────────────┐     HTTP      ┌─────────────┐
│   React     │ ────────────► │   Express   │ ────────────► │  FastAPI    │
│  Frontend   │ ◄──────────── │   Backend   │ ◄──────────── │ AI Service  │
│             │               │             │               │ (rule-based)│
└─────────────┘               └──────┬──────┘               └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   MongoDB   │
                              │  (planned)  │
                              └─────────────┘
```

### Target (OpenRouter LLM)

```
┌─────────────┐     REST      ┌─────────────┐     HTTP      ┌─────────────┐
│   React     │ ────────────► │   Express   │ ────────────► │  FastAPI    │
│  Frontend   │ ◄──────────── │   Backend   │ ◄──────────── │ AI Service  │
└─────────────┘               └──────┬──────┘               └──────┬──────┘
                                     │                             │
                                     │ (advisor)                   │ (fraud)
                                     ▼                             ▼
                              ┌─────────────────────────────────────────┐
                              │              OpenRouter LLM API          │
                              └─────────────────────────────────────────┘
```

---

## Data Flow

### Receipt verification

1. User pastes an SMS on the **Verify Receipt** page.
2. Frontend sends `POST /api/fraud/verify` with `messageText`, `provider`, and optional `amount`.
3. Backend checks `AI_SERVICE_URL`:
   - If set and reachable → forwards to Python `POST /score`.
   - On failure → falls back to the Node rule engine.
4. AI service calls OpenRouter and returns structured results.
5. UI renders the risk gauge, verdict banner, parsed fields, and flags.

### Financial advisor

1. User sends a message on the **Advisor** page.
2. Frontend sends `POST /api/advisor/chat`.
3. Backend calls OpenRouter for a contextual reply, replacing the current keyword matcher.
4. Response displayed in the chat window with a financial guidance disclaimer.

---

## Module Status

| Module | Location | Current | Planned |
|--------|----------|---------|---------|
| Receipt verification UI | `frontend/src/pages/VerifyReceipt.jsx` | Working | No changes needed |
| Financial advisor UI | `frontend/src/pages/Advisor.jsx` | Working (UI) | No changes needed |
| Fraud API | `backend/src/routes/fraud.js` | Working | No changes needed |
| Rule engine (Node) | `backend/src/services/fraudScorer.js` | Active fallback | Retained as fallback |
| AI service (Python) | `ai-service/` | Rule-based scorer | OpenRouter LLM integration |
| OpenRouter LLM | — | Not integrated | Fraud scoring + advisor chat |
| Database models | `backend/src/models/` | Not started | Persist fraud results |

---

## 1. Fraud Detection (Primary AI Path)

This is the core AI feature: paste a mobile money SMS and receive a **risk score**, **verdict**, and **flags**.

### Frontend entry point

**File:** `frontend/src/pages/VerifyReceipt.jsx`

The page collects:

- `messageText` — pasted SMS or receipt text
- `provider` — M-Pesa, MTN MoMo, or Airtel Money
- `amount` — optional expected payment amount

It calls the backend via:

```javascript
const data = await apiPost('/api/fraud/verify', {
  messageText,
  provider,
  amount: amount ? Number(amount) : undefined,
});
```

The UI displays:

- `riskScore` (0–100) as a circular gauge
- `verdict` — `LIKELY_GENUINE`, `SUSPICIOUS`, or `HIGH_RISK`
- `flags` — list of detected issues
- `parsed` — extracted transaction ID, amount, and provider

The frontend does **not** call the AI service or OpenRouter directly.

### Backend routing and AI service proxy

**File:** `backend/src/routes/fraud.js`

When `AI_SERVICE_URL` is configured (see `backend/.env.example`), the backend forwards the request to the Python service:

```
POST {AI_SERVICE_URL}/score
Body: { messageText, provider, amount }
```

| Condition | What runs | Response `source` |
|-----------|-----------|-------------------|
| `AI_SERVICE_URL` set and `/score` succeeds | Python AI service (OpenRouter LLM) | `"ai-service"` |
| AI service down, unset, or error | Node rule engine | `"rule-engine"` |

### Rule engine (fallback)

**File:** `backend/src/services/fraudScorer.js`

Used when the AI service or OpenRouter is unavailable. Heuristic scoring checks:

- **Provider mismatch** — form provider vs text content
- **Amount parsing** — regex extraction vs expected amount
- **Transaction ID** — regex extraction
- **Suspicious keywords** — e.g. `confirm`, `pending`, `click here`, `verify now`, `bit.ly`, `tinyurl`
- **Unverified links** — `http://` without recognized provider domains

**Verdict thresholds:**

| Risk score | Verdict |
|------------|---------|
| 0–29 | `LIKELY_GENUINE` |
| 30–59 | `SUSPICIOUS` |
| 60–100 | `HIGH_RISK` |

### Python AI service

**Directory:** `ai-service/`

| File | Role |
|------|------|
| `main.py` | FastAPI app — `GET /health`, `POST /score` |
| `scorer.py` | Scoring logic — rule-based today; OpenRouter LLM planned |
| `requirements.txt` | FastAPI, uvicorn, pydantic |

**Planned environment variables:**

| Variable | Purpose |
|----------|---------|
| `AI_SERVICE_URL` | Backend proxy target (already in use) |
| `OPENROUTER_API_KEY` | Authentication for OpenRouter API |
| `OPENROUTER_MODEL` | Model identifier on OpenRouter (e.g. `anthropic/claude-3-haiku`) |

**Start command:**

```bash
npm run dev:ai
# Runs: uvicorn main:app --reload --port 8000
```

**OpenRouter integration in `scorer.py` (planned):**

- Send the SMS text, provider, and expected amount to an LLM via OpenRouter
- Prompt the model to return structured JSON: `riskScore`, `verdict`, `flags`, `parsed`
- Validate and normalize the LLM response before returning it
- Fall back to rule-based scoring if the LLM call fails or returns invalid output

---

## 2. Financial Advisor

The **Advisor** page is a chat interface for saving, budgeting, and fraud-awareness guidance.

### Frontend

**File:** `frontend/src/pages/Advisor.jsx`

Posts user messages to:

```
POST /api/advisor/chat
Body: { message: "..." }
```

Displays the `reply` field from the response.

### Backend

**File:** `backend/src/routes/advisor.js`

**Current:** static `TIPS` map with keyword matching (`save`, `budget`, `fraud`, etc.).

**Planned (OpenRouter):**

- Replace keyword matching with an OpenRouter LLM call
- System prompt scoped to mobile money traders — saving, budgeting, fraud prevention
- Include a disclaimer in every response (not professional financial advice)
- Retain static tips as fallback if the LLM call fails

---

## 3. Current vs Planned AI Capabilities

| Capability | Today | With OpenRouter LLM |
|------------|-------|---------------------|
| Fraud risk scoring | Rule engine | LLM analysis |
| Suspicious phrase detection | Keyword list | LLM contextual understanding |
| Multi-language SMS | Limited | LLM native support |
| Financial advisor chat | Static tips | LLM conversational replies |
| Provider format validation | Regex patterns | LLM understands provider-specific SMS formats |
| Cost per verification | Free (rules) | OpenRouter API usage |

---

## 4. API Reference (AI-related endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fraud/verify` | Analyze a mobile money receipt |
| `POST` | `/api/advisor/chat` | Financial advisor chat |
| `GET` | `/api/health` | Backend health check |
| `GET` | `{AI_SERVICE_URL}/health` | AI service health check |
| `POST` | `{AI_SERVICE_URL}/score` | AI fraud scoring |

### Fraud verify response shape

The response contract is fixed across all scoring methods (rule engine and LLM):

```json
{
  "source": "ai-service",
  "riskScore": 45,
  "verdict": "SUSPICIOUS",
  "flags": ["Message contains unverified short link", "Amount format inconsistent with M-Pesa standard"],
  "parsed": {
    "amount": 5000,
    "transactionId": "ABC123XYZ",
    "provider": "mpesa"
  },
  "note": "Analyzed by AI service"
}
```

---

## 5. Implementation Roadmap

**AI service (`ai-service/`):**

- [ ] Add OpenRouter client and environment configuration
- [ ] Implement LLM-powered scoring in `scorer.py` with structured JSON output
- [ ] Add prompt engineering for mobile money fraud patterns (M-Pesa, MTN MoMo, Airtel Money)
- [ ] Retain rule-based fallback on LLM failure
- [ ] Update `/health` to report active model/provider

**Financial advisor (`backend/src/routes/advisor.js`):**

- [ ] Replace keyword matcher with OpenRouter LLM call
- [ ] Add system prompt for trader-focused financial guidance
- [ ] Retain static tips as fallback

**Configuration:**

- [ ] Add `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` to `.env.example` files
- [ ] Document setup in README

---

## 6. Running the Stack Locally

```bash
# Terminal 1 — API server (port 5000)
npm run dev:backend

# Terminal 2 — Web app (port 5173)
npm run dev:frontend

# Terminal 3 — AI service (port 8000)
npm run dev:ai
```

**Required environment:**

```
# backend/.env
AI_SERVICE_URL=http://localhost:8000

# ai-service/.env
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

Set `AI_SERVICE_URL=http://localhost:8000` in `backend/.env` to route fraud verification through the AI service. Without the AI service running, the backend falls back to the Node rule engine.

---

## 7. Key Takeaways

- **All AI** = OpenRouter LLM for fraud analysis and financial advisor chat — no custom models, datasets, or machine learning.
- **Integration path** = Python AI service and Express proxy for fraud scoring; Express backend for advisor chat.
- **Rule engine** = fallback when the AI service or OpenRouter API is unavailable.
- **No frontend changes** required — the API response shape stays consistent.
- **OpenRouter** handles intelligent analysis, multi-language support, and contextual financial guidance through prompt engineering.

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and user flow
- [TEAM_TASKS.md](./TEAM_TASKS.md) — Team task breakdown
- [README.md](../README.md) — Project overview and setup
