# Backend Developer Guide

Guide for the Node.js / Express / MongoDB backend.

**Repo:** https://github.com/Asemeit/Smart-AI-Mobile-Money-Fraud-detection-system

---

## 1. Setup

```bash
git clone https://github.com/Asemeit/Smart-AI-Mobile-Money-Fraud-detection-system.git
cd Smart-AI-Mobile-Money-Fraud-detection-system

npm run install:all

cp backend/.env.example backend/.env
```

### Run backend only

```bash
npm run dev:backend
```

API runs at **http://localhost:5000**

Test:

```bash
curl http://localhost:5000/api/health
```

### Git workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feature/yourname-mongodb
# work, commit, push
# Open PR → develop
```

---

## 2. Folder structure

```
backend/
├── .env.example
├── package.json
└── src/
    ├── server.js              # App entry, middleware, route mounting
    ├── routes/
    │   ├── fraud.js           # POST /api/fraud/verify
    │   ├── transactions.js    # GET /api/transactions (sample data now)
    │   └── advisor.js         # POST /api/advisor/chat (stub)
    ├── services/
    │   └── fraudScorer.js     # Rule-based fraud logic
    ├── models/                # MongoDB schemas (YOU build this)
    └── middleware/            # Auth, validation (YOU add this)
```

---

## 3. What's done vs what you build

| Done | You build |
|------|-----------|
| Express server + CORS | MongoDB connection |
| Health check | User model + auth (JWT) |
| Fraud verify (rule engine) | Save fraud checks to DB |
| Sample transactions array | Real transaction CRUD |
| Advisor keyword replies | Optional: Gemini/OpenAI API |
| Basic error responses | Validation + rate limiting |

---

## 4. Recommended build order

### Phase 1 — MongoDB (start here)

**Goal:** Replace fake sample data with a real database.

1. Install mongoose:
   ```bash
   cd backend
   npm install mongoose
   ```

2. Add to `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/momo-fraud-detector
   ```
   Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier for cloud DB.

3. Create `src/config/db.js` — connect on server start.

4. Create models in `src/models/`:
   - `Transaction.js` — stored payment verifications
   - `FraudCheck.js` — or embed fraud result inside Transaction
   - `User.js` — for auth (phase 2)

5. Update `transactions.js`:
   - `GET /` → `Transaction.find()` from MongoDB
   - `POST /` → save new transaction (optional now)

**Done when:** Dashboard shows real data from MongoDB, not the hardcoded array.

---

### Phase 2 — Auth (JWT)

**Goal:** Users can register and log in.

1. Install:
   ```bash
   npm install bcryptjs jsonwebtoken
   ```

2. Create `src/routes/auth.js`:
   - `POST /api/auth/register` — email, password, name
   - `POST /api/auth/login` — returns JWT token
   - `GET /api/auth/me` — current user (protected)

3. Create `src/middleware/auth.js` — verify JWT on protected routes.

4. Hash passwords with bcrypt (never store plain text).

**Tell frontend teammate** when endpoints are ready so she can wire login UI.

---

### Phase 3 — Persist fraud verifications

**Goal:** Every receipt check is saved.

Update `POST /api/fraud/verify` in `routes/fraud.js`:

1. Run fraud scorer (already works).
2. Save result to MongoDB (userId if logged in).
3. Return same JSON to frontend.

Fields to store: `messageText`, `provider`, `amount`, `riskScore`, `verdict`, `flags`, `createdAt`.

---

### Phase 4 — Improve APIs

- Input validation (e.g. `express-validator`)
- Rate limiting (`express-rate-limit`) on `/api/fraud/verify`
- Filter transactions: `GET /api/transactions?status=flagged`
- Pagination: `?page=1&limit=20`
- API docs (Swagger) — optional but good for presentation

---

### Phase 5 — Integrations (optional)

| Integration | File | Notes |
|-------------|------|-------|
| LLM advisor | `routes/advisor.js` | Call Gemini/OpenAI with API key in `.env` |
| AI fraud service | `routes/fraud.js` | Already tries `AI_SERVICE_URL` — wire Python service or skip |
| Alerts | new `routes/alerts.js` | Stub email/SMS notification on HIGH_RISK |

---

## 5. API contract (keep stable for frontend)

Frontend already calls these — **don't break the response shape** without telling the team.

### `GET /api/health`
```json
{ "status": "ok", "service": "...", "version": "0.1.0" }
```

### `GET /api/transactions`
```json
{
  "transactions": [
    {
      "id": "TXN001",
      "provider": "M-Pesa",
      "amount": 1500,
      "sender": "254712***890",
      "status": "verified",
      "riskScore": 8,
      "createdAt": "2026-06-05T10:30:00Z"
    }
  ],
  "total": 3
}
```

### `POST /api/fraud/verify`
**Body:** `{ "messageText": "...", "provider": "M-Pesa", "amount": 1500 }`

**Response:**
```json
{
  "source": "rule-engine",
  "riskScore": 35,
  "verdict": "SUSPICIOUS",
  "flags": ["..."],
  "parsed": { "amount": 1500, "transactionId": "ABC123", "provider": "mpesa" }
}
```

### `POST /api/advisor/chat`
**Body:** `{ "message": "How do I save?" }`  
**Response:** `{ "reply": "...", "category": "financial-advice" }`

### New endpoints you will add

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT |
| GET | `/api/auth/me` | Current user |

---

## 6. Example: Transaction model

```javascript
// src/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: String,
  amount: Number,
  sender: String,
  messageText: String,
  riskScore: Number,
  verdict: String,
  flags: [String],
  status: { type: String, enum: ['verified', 'flagged', 'pending'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
```

---

## 7. Testing your work

Use PowerShell or Postman:

```powershell
# Health
Invoke-RestMethod http://localhost:5000/api/health

# Verify receipt
Invoke-RestMethod -Uri http://localhost:5000/api/fraud/verify -Method POST `
  -ContentType "application/json" `
  -Body '{"messageText":"CONFIRMED click here http://bit.ly/fake","provider":"M-Pesa"}'

# Transactions
Invoke-RestMethod http://localhost:5000/api/transactions
```

Run frontend alongside backend so the UI still works.

---

## 8. Environment variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens (you add this) |
| `AI_SERVICE_URL` | Optional Python AI service |
| `GEMINI_API_KEY` or `OPENAI_API_KEY` | Optional LLM for advisor |

Never commit `.env` — it's in `.gitignore`.

---

## 9. Coordination with teammates

| When you finish... | Tell... |
|--------------------|---------|
| Auth endpoints | Frontend — she wires login UI |
| Transaction API changes | Frontend — dashboard/history pages |
| New fields on fraud response | Frontend — verify result screen |
| LLM advisor | Everyone — demo improvement |

Document API changes in README or this file.

---

## 10. Related docs

| File | Purpose |
|------|---------|
| [TEAM_TASKS.md](TEAM_TASKS.md) | Full backend task list |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | What frontend expects from your API |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Git workflow |

---

## Suggested weekly plan

| Week | Focus |
|------|-------|
| 1 | MongoDB + save transactions |
| 2 | JWT auth (register/login) |
| 3 | Persist fraud checks, validation, filters |
| 4 | LLM advisor or alerts, polish, help deploy |

Each week = at least one PR to `develop` so your contribution is visible.
