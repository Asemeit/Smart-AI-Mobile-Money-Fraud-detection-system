# System Architecture

## Overview

```
┌─────────────┐     REST      ┌─────────────┐     HTTP      ┌─────────────┐
│   React     │ ────────────► │   Express   │ ────────────► │  FastAPI    │
│  Frontend   │ ◄──────────── │   Backend   │ ◄──────────── │ AI Service  │
│  (PWA)      │               │             │               │ (TensorFlow)│
└─────────────┘               └──────┬──────┘               └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   MongoDB   │
                              │  (planned)  │
                              └─────────────┘
```

## User flow

1. Trader receives mobile money payment SMS
2. User pastes message into **Verify Receipt** page
3. Frontend sends text to backend `/api/fraud/verify`
4. Backend calls AI service (or falls back to rule engine)
5. Risk score and verdict returned; user sees alert or confirmation
6. Optional: **Financial Advisor** gives budgeting/safety tips

## Modules

| Module | Location | Status |
|--------|----------|--------|
| Dashboard | `frontend/src/pages/Dashboard.jsx` | Starter |
| Receipt verification | `frontend/src/pages/VerifyReceipt.jsx` | Working |
| Financial advisor | `frontend/src/pages/Advisor.jsx` | Stub |
| Fraud API | `backend/src/routes/fraud.js` | Working |
| Rule engine | `backend/src/services/fraudScorer.js` | Prototype |
| AI service | `ai-service/` | Prototype |
| Auth | — | Not started |
| Database | `backend/src/models/` | Not started |

## Security considerations (TODO)

- Never store raw SMS with full phone numbers in logs
- Hash passwords with bcrypt
- Validate all inputs server-side
- Use HTTPS in production
- Rate-limit verification endpoint to prevent abuse

## SDG & AU Agenda 2063

Document in final report how the system supports SDGs 1, 8, 9, 10 and AU Aspiration 1 & 6 (see README).
