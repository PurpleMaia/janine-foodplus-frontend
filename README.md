# Food+ Frontend

A Next.js application for tracking and managing legislative bills related to food and agriculture in Hawaiʻi. This repository contains the frontend application, developer utilities, and scripts used to run and maintain the project locally and in production.

---

## Table of contents

- Project overview
- Architecture & key components
- Prerequisites
- Environment variables
- Local database setup
- Development (run & build)
- Backend services & integrations
- How the app works (high level)
- Contributing
- Testing & linting
- Deployment notes
- Troubleshooting & support
- Useful links

---

## Project overview

Food+ is a Kanban-style bill tracker focused on food- and agriculture-related legislation for Hawaiʻi. The UI shows bills as cards that can be filtered, viewed, and (when authenticated) updated by contributors. The app uses machine learning to classify bill status and an external scraper to fetch legislative updates.

## Architecture & key components

- Frontend: Next.js (app router) + React + TypeScript + Tailwind CSS. UI primitives come from custom components in `src/components/ui` and Radix.
- Server-side database access: Kysely (Postgres) via `db/kysely/client.ts`.
- Authentication: lightweight custom session handling plus Lucia-related patterns (see `src/lib/simple-auth.ts` and `src/contexts/auth-context.tsx`).
- Server actions / services: `src/services/*` contain server-side functions (database operations, LLM calls, scraping triggers).
- State & caching: TanStack Query (React Query) + React Context providers in `src/contexts/*`.
- AI & scraping: OpenAI (for LLM classification); an external scraping service is used to ingest bill data.

Project layout (important folders):

```
src/
├── ai/                 # genkit/googleAI configuration and prompts (not in use)
├── app/                # Next.js app router
├── components/         # UI components (kanban, llm, new-bill, scraper, auth, admin etc.)
├── contexts/           # React Context providers (auth, bills, kanban state)
├── hooks/              # Custom hooks (query hooks, toast, adopted bills helpers)
├── lib/                # Utilities, providers, react-query client
├── services/           # Server-side actions and API helpers (legislation, llm, scraper)
└── db/                 # Database typing and Kysely client
```

## Prerequisites

- Node.js 18+ (recommended 18 or 20)
- npm (or yarn)
- Git
- PostgreSQL database for local development (or a hosted Postgres instance)
- Optional: access keys for OpenAI and Google GenAI if you want LLM features locally

## Environment variables

Create a `.env` file in the repository root (do not commit secrets). The main variables used by the app and scripts are:

- DATABASE_URL - Postgres connection string used by Kysely and setup scripts
- OPENAI_API_KEY - OpenAI API key (used by server LLM service)
- OPENAI_BASE_URL - Optional base URL if using a proxy/alternate OpenAI endpoint
- VLLM - Vllm model name for testing
- LLM - LLM model name for testing

## Development (run & build)

Install dependencies and run the dev server:

```bash
npm install
npm run dev
# Open http://localhost:9002
```

Available npm scripts (high level):

- npm run dev — Start dev server (Next.js, port 9002 by default in package.json)
- npm run build — Build production app
- npm run start — Start the built app
- npm run lint — Run ESLint
- npm run typecheck — Run TypeScript typecheck
- npm run kysely:generate — Generate DB types from DATABASE_URL with kysely-codegen

If the app does not pick up `.env`, confirm your terminal has the environment variables exported (zsh profile, direnv, or use a .env loader).

## Backend services & integrations

This repo interacts with several backend services and APIs:

- PostgreSQL (primary DB) — stores bills, status updates, users, auth keys, and user-bill relationships. Accessed via Kysely in `db/kysely/client.ts` and `src/lib/*` utilities.
- OpenAI — used by `src/services/llm.ts` to classify bill status from recent status lines. Requires `OPENAI_API_KEY`.
- External Scraper / Scraping API — the app expects bill data scraped periodically or on-demand. Scraper triggers live in `src/services/scraper.ts` and UI buttons in `src/components/scraper`.

Security note: the frontend never connects directly to the database. Server-side services (server actions / API routes) perform DB operations and enforce authentication.

## How the app works (high level flow)

1. Public users visit the site and can view bills and statuses (read-only).
2. Authenticated users (created via scripts or admin flow) can adopt bills, drag-and-drop cards on the Kanban board, edit bill details, and trigger scrapes or LLM reclassification.
3. When a UI action requires a DB change, the frontend calls a server-side service (server action or API route) in `src/services/*`. Those services validate input, check the session, and use Kysely (or `db` client) to update Postgres.
4. LLM classification: when the app needs a bill status classification, it calls `src/services/llm.ts`, which sends a minimal prompt to OpenAIx and returns a single canonical status category.
5. Background scraping: the scraper can be triggered manually from the UI or run as a scheduled job externally. Scraped updates are written to the `status_updates` table and may trigger reclassification.

## Contributing

Follow these steps to contribute to the project:

1. Check issues and existing documentation to find a task.
2. Create a feature branch from `main` (or the repo default branch):

```bash
git checkout -b feature/<short-description>
```

3. Make changes in a focused, well-scoped commit. Use clear commit messages and include the issue number if applicable.
4. Run linting and type checking locally:

```bash
npm run lint
npm run typecheck
```

5. If your changes touch database types, regenerate Kysely types:

```bash
export DATABASE_URL="..."
npm run kysely:generate
```

6. Create a pull request. In the PR description:
   - Summarize the change and motivation
   - Include screenshots or code snippets if UI/UX changed
   - Provide techincal details on the change

7. Address code review feedback, re-run tests/lint, and squash or clean commits if requested.

Branch naming and PR guidance:
- Use `feature/`, `bugfix/`, `optimize/` prefixes.

Coding style:
- TypeScript + React functional components
- Use existing hooks and context providers instead of reimplementing state behavior
- Prefer server-side services in `src/services/` for DB interactions

## Testing & linting

- ESLint (run `npm run lint`) is configured. Fix lint errors before submitting PRs.
- Type checking: `npm run typecheck`.
- There are no automated test scripts included by default; add unit/integration tests as needed and document how to run them in PRs.

## Deployment notes

- Build for production: `npm run build` then `npm run start`.
- Ensure production environment has the required env vars (DATABASE_URL, OPENAI_API_KEY).
- Database migrations: this repo uses DDL setup scripts located in `scripts/`. For production, run your curated migrations or managed schema updates.
- When deploying to a platform (Vercel, Cloud Run, etc.), set environment variables in the platform settings and ensure Postgres is reachable from the deployed environment.

## Useful links

- Authentication docs: `docs/authentication-setup.md`
- Scripts: `scripts/` (setup/helper/test scripts for DB & users)
- Kysely types generator config: `.kysely-codegenrc.json`

---

License

Add license information here (e.g., MIT) and include a LICENSE file at the repository root.
