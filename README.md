# Smart AI Mobile Money Fraud Detection System

A web-based platform that helps mobile money merchants and small business owners detect fake payment receipts, identify suspicious transactions, and receive practical financial guidance.

Supports popular platforms including **M-Pesa**, **MTN MoMo**, and **Airtel Money**.

---

## Features

- **Receipt verification** — Paste an SMS or payment confirmation and get an instant fraud risk score
- **Transaction dashboard** — Track verified and flagged payments in one place
- **AI financial advisor** — Budgeting, saving, and fraud-awareness tips through a chat interface
- **Multi-platform support** — Built for the mobile money formats used across East and West Africa

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| AI Service | Python, FastAPI |
| Database | MongoDB *(planned)* |
| ML | TensorFlow *(planned)* |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Python](https://www.python.org/) 3.10+ *(optional, for AI service)*

### Installation

```bash
git clone https://github.com/Asemeit/Smart-AI-Mobile-Money-Fraud-detection-system.git
cd Smart-AI-Mobile-Money-Fraud-detection-system

npm run install:all
```

### Environment setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Run locally

```bash
# Terminal 1 — API server (port 5000)
npm run dev:backend

# Terminal 2 — Web app (port 5173)
npm run dev:frontend

# Terminal 3 — AI service (port 8000, optional)
npm run dev:ai
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
├── frontend/       React web application
├── backend/        Node.js REST API
├── ai-service/     Python fraud scoring service
└── docs/           Architecture and development notes
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/fraud/verify` | Analyze a mobile money receipt |
| `GET` | `/api/transactions` | List recent transactions |
| `POST` | `/api/advisor/chat` | Financial advisor chat |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions, and pull request guidelines.

---

## License

MIT
