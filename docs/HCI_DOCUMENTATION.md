# HCI Features — MoMo Shield

Short reference for Human-Computer Interaction coursework: usability, learnability, feedback, consistency, and security.

## Features

### 1. Interactive onboarding tutorial
- **Where:** Shown automatically after first login (inside the main app layout).
- **Steps:** Welcome & security → What to do first → Risk vs confidence scores → Why fraud is flagged.
- **Replay:** Sidebar footer → **? Tutorial**.
- **Storage:** `localStorage` key `momo_tutorial_complete_{userId}`.

### 2. Dual scores
| Score | Meaning |
|-------|---------|
| **Risk (0–100%)** | How dangerous the message looks. Lower is safer. |
| **Confidence (0–100%)** | How sure the system is based on parsed data (amount, ref, provider, flags). |

Shown on **Verify Receipt**, **Dashboard**, and **History**. API field: `confidenceScore`.

### 3. Fraud explanations
- **Where:** Verify Receipt results panel — **“Why was this marked this way?”**
- **Purpose:** Plain-language summary plus per-flag explanations (not just a raw score).
- **Code:** `frontend/src/utils/flagExplanations.js`, `frontend/src/components/FraudExplanation.jsx`.

### 4. Trust & security messaging
- **Trust banner** on Dashboard: JWT login, no PIN/password collection, confirm in official app.
- Tutorial step 1 reinforces the same security points.

## HCI principles mapping

| Principle | Implementation |
|-----------|----------------|
| **Learnability** | 4-step tutorial; clear “verify first” path |
| **Usability** | Document type toggle, sample messages, sidebar navigation |
| **Feedback** | Toasts, risk banners, dual scores, flag explanations |
| **Consistency** | Shared verdict colors and labels across pages |
| **Security / trust** | Trust banner, secure login messaging, no credential harvesting |

## Demo script (presentation)

1. Register or log in → tutorial appears.
2. Complete or skip tutorial → open **Verify Receipt**.
3. Paste **fake sample** → show high risk, explanations, and flags.
4. Paste **genuine sample** → show lower risk and higher confidence.
5. Open **Dashboard** → trust banner and history table with both scores.
6. Click **? Tutorial** to replay onboarding.

## Key files

```
frontend/src/components/OnboardingTutorial.jsx
frontend/src/components/FraudExplanation.jsx
frontend/src/components/TrustBanner.jsx
frontend/src/utils/flagExplanations.js
backend/src/services/fraudScorer.js   # computeConfidenceScore()
backend/src/models/FraudCheck.js      # confidenceScore field
```

## Reset tutorial (testing)

In browser dev tools (while logged in):

```js
localStorage.removeItem('momo_tutorial_complete_YOUR_USER_ID');
location.reload();
```

Or use **? Tutorial** in the sidebar after clearing the key.
