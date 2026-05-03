# ScopeShift

Turn service calls into solutions.

ScopeShift is a standalone Next.js, TypeScript, Tailwind, and Prisma application for AI-powered residential service technician role-play training.

## Included In This Build

- App Router web skeleton under `src/`
- Prisma schema for auth, orgs, sessions, scoring, feedback, presets, memory, and leaderboard tables
- Scenario template seed file
- Cookie-based auth API starter
- Scenario generation, messaging, completion, and dashboard API routes
- Prompt config layer and AI orchestration service
- Initial public, app, and manager pages
- Test data generator script

## Preferred Stack

- Next.js
- TypeScript
- Tailwind
- PostgreSQL
- Prisma
- shadcn-style component structure

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate dev`.
5. Run `npm run db:seed` (creates scenario templates plus a demo org, team, and owner user—see `.env.example` for `SEED_*` overrides).
6. Start the app with `npm run dev` and sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults: `admin@scopeshift.local` / `scopeshift` if unset).

## Important Notes

- Auth is implemented as a lightweight cookie session starter, not full NextAuth or Clerk yet.
- AI responses and scoring are currently deterministic service-layer placeholders so the routes and data flow are ready for a real model integration.
- Manager analytics, leaderboard refinement, and voice mode are intentionally not fully built in this first pass.
