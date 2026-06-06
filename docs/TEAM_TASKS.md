# Team Task Breakdown

Use this document to assign work. Create GitHub Issues from each section.

## Frontend team

- [ ] Add user login/register screens
- [ ] Implement PWA manifest and service worker (offline support)
- [ ] Add Web Speech API for voice input on Verify & Advisor pages
- [ ] Build transaction history page with filters
- [ ] Add real-time toast notifications for fraud alerts
- [ ] Improve mobile responsiveness and accessibility (ARIA labels)
- [ ] Multi-language UI (English, Swahili, French)

## Backend team

- [ ] Connect MongoDB (see `backend/src/models/`)
- [ ] Implement JWT authentication (`/api/auth/register`, `/api/auth/login`)
- [ ] Persist verified transactions and fraud results
- [ ] Add rate limiting and input validation middleware
- [ ] Webhook/notification service for fraud alerts (email/SMS stub)
- [ ] API documentation (Swagger/OpenAPI)

## AI / ML team

- [ ] Collect labeled dataset of genuine vs fake mobile money SMS
- [ ] Build TensorFlow text classification model
- [ ] Replace rule-based scorer in `ai-service/scorer.py`
- [ ] Add pattern analysis for replay scams and duplicate transaction IDs
- [ ] Evaluate model accuracy and document in `docs/MODEL_REPORT.md`
- [ ] Integrate LLM or RAG for financial advisor (optional)

## DevOps / Documentation

- [ ] Set up GitHub Actions CI (lint + test)
- [ ] Deploy frontend (Vercel/Netlify) and backend (Render/Railway)
- [ ] Write user manual for traders (`docs/USER_GUIDE.md`)
- [ ] Prepare presentation slides for lecturer demo

## Suggested sprint order

1. **Week 1:** Everyone runs project locally; backend adds MongoDB; frontend polishes UI
2. **Week 2:** Auth + saved transactions; AI team starts dataset
3. **Week 3:** ML model integration; alerts; advisor improvements
4. **Week 4:** PWA, voice, testing, deployment, presentation

## Definition of done

- Feature works locally
- PR reviewed by at least one teammate
- README or docs updated if setup/API changed
