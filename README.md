# Tracer

Automatisierte Editorial-Inhalte für Radiologie, Nuklearmedizin & Bildgebung.

**Live**: https://tracer.molmed.eu

## Zwei Produkte, eine Plattform

- **Tracer Studio** — SaaS, generiert wöchentlich CI-konforme LinkedIn-Editorial-Bilder + Posts für Praxen und MedTech-Firmen
- **Tracer Brief** — wöchentlicher Newsletter (DE/EN) zu KI, Bildgebung und MedTech-Trends

Newsletter-Subscriber sind warme Leads für den SaaS, SaaS-Pipeline liefert Content-Ideen für den Newsletter.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (eu-central-1, pgvector) · Stripe · Replicate FLUX 1.1 Pro · OpenAI · Anthropic Claude Sonnet 4.6 · Voyage AI Embeddings · Beehiiv · Resend · Crisp · Plausible · Sentry. Hosting Vercel, Cron eingebaut.

## Dokumentation

- `docs/SYSTEM.md` — Architektur, Stack, Datenfluss
- `docs/ROADMAP.md` — 12-Wochen-Plan (KW 1–10 implementiert, KW 11–12 = Outreach)
- `supabase/README.md` — DB-Setup, Migrationen, Storage-Bucket
- `supabase/migrations/*.sql` — Schema-Migrationen, in numerischer Reihenfolge einspielen

## Setup

```bash
npm install
cp .env.example .env.local
# .env.local mit API-Keys füllen
npm run dev
```

## Routen

### Public
- `/` — Coming-Soon-Page mit Newsletter-Signup
- `/about` — Über Tracer
- `/pricing` — 3 Tarife mit Stripe Checkout (Solo 49 €, Praxis 99 €, Team 199 €)
- `/brief` — Newsletter-Landing
- `/brief/archive` — alle versendeten Ausgaben
- `/brief/[slug]` — Einzelausgabe als Webview (`<year>-kw<NN>-<de|en>`)
- `/brief/sponsor` — Sponsor-Slot-Buchung mit Stripe one-off
- `/studio/onboarding` — Brand-Profil anlegen

### Owner-only (Token-geschützt via `CRON_SECRET`/`APPROVAL_SECRET`)
- `/studio/library?key=<CRON_SECRET>` — alle generierten Briefs
- `/studio/dashboard?customer=<id>&t=<token>` — Customer-Dashboard
- `/studio/settings?customer=<id>&t=<token>` — Customer-Settings

### API
- `POST /api/studio/generate` — manuell triggerbar (Bearer `CRON_SECRET`)
- `GET  /api/brief/approve?issue=&t=&action=` — Magic-Link-Approve für Owner
- `GET  /api/studio/approve?brief=&t=&action=` — Magic-Link-Approve für Customer
- `POST /api/stripe/checkout` — Subscription-Checkout
- `POST /api/stripe/portal` — Customer-Portal-Session
- `POST /api/stripe/webhook` — Stripe-Events (verifiziert)
- `GET  /api/cron/sources/scrape` — täglich 04:00 UTC
- `GET  /api/cron/brief/draft` — Sonntag 18:00 UTC
- `GET  /api/cron/brief/publish` — Montag 06:00 UTC
- `GET  /api/cron/studio/generate` — Mittwoch 09:00 UTC
- `GET  /api/cron/onboarding/mails` — täglich 08:00 UTC

Cron-Schedules in `vercel.json`.
