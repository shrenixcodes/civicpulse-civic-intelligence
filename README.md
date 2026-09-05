# CivicPulse

CivicPulse turns citizen complaints into prioritized, evidence-backed civic issues: reports get AI-classified, clustered by similarity (including across English/Hindi/Tamil), scored with a transparent priority formula, and surfaced on an admin command center as actionable hotspots.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL via Prisma

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to any reachable Postgres instance (local, Docker, or a free hosted database like [Neon](https://neon.tech) or [Supabase](https://supabase.com)). `GEMINI_API_KEY` is optional — without it, the app automatically uses a deterministic local mock AI provider, so everything works out of the box with zero API calls.

3. **Create the schema and seed demo data**

   ```bash
   npm run db:push
   npm run db:seed
   ```

   This seeds ~200 realistic citizen reports across 32 issue clusters (water outages, potholes, garbage, sewage, flooding, electricity, street lighting) in English, Hindi, and Tamil, around Chennai — with AI fields and priority scores already computed locally (no Gemini calls during seeding).

4. **Run the app**

   ```bash
   npm run dev
   ```

   - `/` — landing page
   - `/report` — citizen reporting form
   - `/dashboard` — admin Command Center

## AI usage

All Gemini access goes through [`lib/ai.ts`](lib/ai.ts), the single provider module. It automatically falls back to a deterministic `MockAIProvider` when `GEMINI_API_KEY` is unset, so the app — and its demo data — never depends on a live API key.

Gemini is only ever called:
- when a citizen submits a new report, or
- when an admin clicks **Run AI Analysis** on the dashboard.

It is never called on page load, on polling, for chart rendering, for seeded data, or for every "Ask CivicPulse" question — common questions are answered deterministically from stored data; Gemini is only a fallback for anything else.

## Data model

Three tables: `reports`, `issue_clusters`, `status_history` (see [`prisma/schema.prisma`](prisma/schema.prisma)).

## Priority score

Deterministic and transparent — no AI involved:

- 30% severity
- 25% report volume
- 20% geographic concentration
- 15% recent trend
- 10% urgency

See [`lib/priority.ts`](lib/priority.ts). Each issue's detail page shows the full point-by-point breakdown.

## Deployment

The app is a standard Next.js project and deploys to any Node hosting platform (Vercel, Railway, Fly.io, etc.):

1. Provision a Postgres database and set `DATABASE_URL` in your host's environment variables.
2. Run `npm run db:push` (or a Prisma migration) against that database once.
3. Optionally set `GEMINI_API_KEY` to enable live AI analysis — omit it to keep running on the deterministic mock provider.
4. `npm run build && npm run start`.

No Docker, Kubernetes, or cloud infrastructure setup is required.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run db:push` | Sync the Prisma schema to your database |
| `npm run db:seed` | Populate demo data |
| `npm run lint` | Lint the codebase |
