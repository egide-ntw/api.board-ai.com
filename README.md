# Board AI API

Board AI powers multi-agent debates between specialized personas. The API handles authentication, conversation orchestration, WebSocket streaming, analytics, and file handling for the debate system.

## What this service does

- Manage users, sessions, and roles (user and admin)
- Create conversations and orchestrate multi-round debates between AI personas
- Stream persona responses over WebSockets (Socket.IO) on the `/board` namespace
- Track token usage and session analytics
- Handle attachments and uploads (local or S3)
- Support social logins (Apple, Facebook, Google, Twitter) and email/password

## Tech stack

- NestJS 9, TypeScript, TypeORM, Postgres
- Redis for caching and queues
- Socket.IO for real-time messaging
- Swagger docs at `/docs`

## Getting started locally

1) Prereqs: Node 18+, pnpm, Docker (for Postgres/Redis/maildev).
2) Copy env file: `cp .env.example .env` and fill secrets (JWT keys, DB, mail, S3 if used).
3) Start services: `docker compose up -d postgres adminer maildev`.
4) Install deps: `pnpm install`.
5) Run migrations and seeds as needed:
	- `pnpm run migration:run`
	- `pnpm run seed:run` (optional sample data)
6) Start API: `pnpm run start:dev` (http://localhost:3000).

## Running with Docker only

```bash
cp .env.example .env
docker compose up -d
```

## Key endpoints

- REST base path is `/api`. Versioned routes use `/v1`.
- Swagger UI: http://localhost:3000/docs (includes bearer auth and try-it-out).
- WebSockets: connect to `ws://localhost:3000/board`.

## Common tasks

- Generate migration: `pnpm run migration:generate -- src/database/migrations/CreateNameTable`
- Run migration: `pnpm run migration:run`
- Revert migration: `pnpm run migration:revert`
- Drop schema: `pnpm run schema:drop`
- Seeds: `pnpm run seed:run`
- Tests: `pnpm run test` and `pnpm run test:e2e`

## Deploying to Railway (quick checklist)

- Set Node to 18.18+ or 20 in Railway settings.
- Provide env vars from `.env.example` (DB, Redis, JWT, mail, S3 if used).
- Build command: `pnpm install --frozen-lockfile && pnpm run build`.
- Start command: `pnpm run start:prod` (runs `node dist/src/main`).

## Project structure (API)

- `src/app.module.ts` entry point
- `src/conversations`, `src/orchestration`: debate flow
- `src/personas`: persona definitions
- `src/messages`, `src/analytics`, `src/attachments`
- `src/auth*`: JWT and social auth strategies
- `src/config`: typed config and validation

## Support

Open an issue with steps to reproduce, expected vs actual behavior, and logs if available. For production incidents, include request IDs and timestamps when possible.
