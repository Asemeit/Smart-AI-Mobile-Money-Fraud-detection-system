# Frontend Developer Guide

Quick start for anyone working on the React UI.

**Repo:** https://github.com/Asemeit/Smart-AI-Mobile-Money-Fraud-detection-system

---

## 1. Setup (first time)

### Install

```bash
git clone https://github.com/Asemeit/Smart-AI-Mobile-Money-Fraud-detection-system.git
cd Smart-AI-Mobile-Money-Fraud-detection-system

npm run install:all
```

### Environment

```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env` can stay empty for local dev — Vite proxies `/api` to the backend automatically.

### Run

You need **two terminals**:

```bash
# Terminal 1 — backend (required for API calls)
npm run dev:backend

# Terminal 2 — frontend
npm run dev:frontend
```

Open **http://localhost:5173**

If the dashboard shows “Unable to load transactions”, the backend is not running.

---

## 2. Git workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable — do not push here directly |
| `develop` | Merge all team work here first |
| `feature/your-name-task` | Your personal work branch |

```bash
git checkout develop
git pull origin develop
git checkout -b feature/yourname-login-page

# ... make changes ...

git add .
git commit -m "feat(frontend): add login page"
git push -u origin feature/yourname-login-page
```

Open a **Pull Request → `develop`** on GitHub (not `main`).

See [CONTRIBUTING.md](../CONTRIBUTING.md) for commit message style.

---

## 3. Folder structure (where to edit)

```
frontend/
├── index.html
├── vite.config.js          # Dev proxy: /api → localhost:5000
├── src/
│   ├── main.jsx            # App entry
│   ├── App.jsx             # Routes
│   ├── index.css           # Global styles + CSS variables
│   ├── api/
│   │   └── client.js       # apiGet / apiPost helpers
│   ├── components/
│   │   ├── Layout.jsx      # Sidebar + mobile nav
│   │   ├── Layout.css
│   │   └── Icons.jsx       # SVG icons
│   └── pages/
│       ├── Dashboard.jsx   # Home + transaction table
│       ├── VerifyReceipt.jsx
│       ├── Advisor.jsx
│       └── *.css           # Page-specific styles
```

**Rule of thumb:** new screens go in `pages/`, reusable pieces in `components/`.

---

## 4. Routes (already wired)

| URL | File | What it does |
|-----|------|--------------|
| `/` | `Dashboard.jsx` | Stats + recent transactions |
| `/verify` | `VerifyReceipt.jsx` | Paste SMS, get fraud score |
| `/advisor` | `Advisor.jsx` | Financial advisor chat |

Add new routes in `App.jsx` and a link in `components/Layout.jsx`.

---

## 5. API — how to call the backend

Use the helpers in `src/api/client.js`:

```javascript
import { apiGet, apiPost } from '../api/client';

// GET example
const data = await apiGet('/api/transactions');

// POST example
const result = await apiPost('/api/fraud/verify', {
  messageText: '...',
  provider: 'M-Pesa',
  amount: 1500,
});
```

### Endpoints you will use

#### `GET /api/health`
Health check.

#### `GET /api/transactions`
Returns sample transactions (will become real data later).

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

#### `POST /api/fraud/verify`
Analyze a mobile money SMS.

**Request:**
```json
{
  "messageText": "ABC123 Confirmed. Ksh1,500 received...",
  "provider": "M-Pesa",
  "amount": 1500
}
```

**Response:**
```json
{
  "source": "rule-engine",
  "riskScore": 35,
  "verdict": "SUSPICIOUS",
  "flags": ["Suspicious phrase detected: \"click here\""],
  "parsed": {
    "amount": 1500,
    "transactionId": "ABC123",
    "provider": "mpesa"
  }
}
```

`verdict` values: `LIKELY_GENUINE` | `SUSPICIOUS` | `HIGH_RISK`

#### `POST /api/advisor/chat`
Financial advisor message.

**Request:** `{ "message": "How do I save money?" }`  
**Response:** `{ "reply": "...", "category": "financial-advice" }`

> Auth endpoints (`/api/auth/login`, etc.) are not built yet — backend teammate will add them. Design login UI with placeholder or mock for now.

---

## 6. Design system (CSS variables)

Global styles live in `src/index.css`. Use these variables so the UI stays consistent:

| Variable | Use |
|----------|-----|
| `--primary` / `--primary-dark` | Buttons, accents |
| `--surface` | Card backgrounds |
| `--text` / `--text-secondary` / `--muted` | Text hierarchy |
| `--danger` / `--warning` / `--success` | Fraud status colors |
| `--border` | Card and input borders |
| `--radius` | Card corner radius |

Existing classes: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.badge-success`, `.form-group`, etc.

Font: **Plus Jakarta Sans** (loaded in `index.html`).

---

## 7. Your tasks (frontend)

From [TEAM_TASKS.md](TEAM_TASKS.md) — pick and claim:

- [ ] Login & register pages
- [ ] Transaction history page with filters
- [ ] Toast notifications for fraud alerts
- [ ] PWA manifest + service worker (offline)
- [ ] Voice input (Web Speech API) on Verify & Advisor
- [ ] Mobile polish + accessibility (ARIA labels)
- [ ] Multi-language UI (English, Swahili, French)

Suggested order:
1. Polish existing 3 pages (mobile, loading states, errors)
2. Login/register screens (UI first; wire to API when backend is ready)
3. Transaction history page
4. PWA + voice + toasts

---

## 8. Testing your work

1. Backend running on port **5000**
2. Frontend on **5173**
3. **Dashboard** — table loads with 3 sample transactions
4. **Verify** — click “Fake” sample → Analyze → risk gauge appears
5. **Advisor** — type a question → get a reply

Test on mobile width (sidebar becomes bottom nav).

---

## 9. Do not edit (other teammates)

| Folder | Owner |
|--------|-------|
| `backend/` | Backend dev |
| `ai-service/` | AI/ML teammate |
| `docs/ARCHITECTURE.md` | Shared — discuss first |

You **can** read `backend/src/routes/` to see what APIs exist or are coming.

---

## 10. Helpful links in the repo

| File | What's in it |
|------|--------------|
| [README.md](../README.md) | Project overview + setup |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Branches, commits, PRs |
| [TEAM_TASKS.md](TEAM_TASKS.md) | Full task list by role |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagram + data flow |

---

## Questions?

Ask in the group chat. If you need a new API endpoint, tell the backend teammate — don’t mock forever without coordinating.
