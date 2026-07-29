# Contributing Guide

Thank you for contributing to the Mobile Money Fraud Detection System.

## Getting started

1. Clone the repo, switch to `develop`, and create your branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-name-module
   ```
2. Run `npm run install:all` and start the dev servers (see README).
3. Pick a task from [docs/TEAM_TASKS.md](docs/TEAM_TASKS.md) or GitHub Issues.

## Branch naming

- `feature/frontend-dashboard` — new UI features
- `feature/backend-auth` — API and database work
- `feature/ai-model` — ML and fraud engine
- `fix/verify-form-validation` — bug fixes
- `docs/setup-guide` — documentation only

## Commit messages

Use clear, descriptive messages:

```
feat(frontend): add receipt paste verification form
fix(backend): handle empty transaction ID
docs: update API endpoint table
```

## Pull request checklist

- [ ] Code runs locally (`npm run dev:frontend` + `npm run dev:backend`)
- [ ] No secrets committed (`.env` stays local)
- [ ] Updated README or docs if you changed setup or APIs
- [ ] Assigned yourself in PR description and linked related task

## Code areas

| Folder | Responsibility |
|--------|----------------|
| `frontend/src/pages/` | Main app screens |
| `frontend/src/components/` | Reusable UI |
| `backend/src/routes/` | REST endpoints |
| `backend/src/models/` | MongoDB schemas (TODO) |
| `ai-service/` | Fraud scoring & future ML models |

## Questions?

Coordinate in your group chat and document decisions in `docs/ARCHITECTURE.md`.
