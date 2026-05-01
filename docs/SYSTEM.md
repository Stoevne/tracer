# Tracer — Systemarchitektur

## Vision

Eine Codebase, ein Deployment, zwei Einnahmequellen, die sich gegenseitig befeuern.

```
                    ┌──────────────┐
                    │    Tracer    │
                    │   (Brand)    │
                    └──────┬───────┘
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌──────────────────┐       ┌──────────────────┐
    │  Tracer Studio   │       │   Tracer Brief   │
    │  (SaaS, B2B)     │       │  (Newsletter)    │
    │                  │       │                  │
    │  49–199 €/Mo     │       │  Sponsored Slots │
    │  pro Kunde       │       │  500–2k €/Slot   │
    └──────────────────┘       └──────────────────┘
              ▲                         │
              │                         │
              └─── Lead-Funnel ─────────┘
```

## Stack

| Layer | Tool | Warum |
|---|---|---|
| Hosting | Vercel | Zero-Ops, Cron eingebaut, eine .env, ein Deploy |
| Frontend | Next.js 14 App Router | SSR, RSC, ISR — alles in einem |
| Styling | Tailwind CSS | Schnell, kein CSS-Bikeshedding |
| Auth + DB | Supabase (EU-Region) | Auth, Postgres, Storage, Edge Functions, AVV-konform |
| Payments | Stripe (Checkout + Customer Portal) | User abonnieren/kündigen selbst |
| Bildgenerierung | Replicate (FLUX 1.1 Pro) + OpenAI (Prompt-Crafting) | Fortgeführt aus RNZ-Pipeline |
| Newsletter-Versand | Beehiiv API | Subscriber-Mgmt, Sponsoren-Marktplatz, hohe Deliverability |
| Scraping | Vercel Cron + Edge Functions | Quellen täglich crawlen |
| LLM-Curator | Anthropic Claude Sonnet 4.6 | Zusammenfassungen Tracer Brief |
| Monitoring | Sentry | Errors → Discord-Webhook |
| Uptime | UptimeRobot | Mail bei Ausfall |
| Support | Crisp + AI-Bot | Eskaliert nur Edge-Cases |
| DNS | Cloudflare | Domain + DNS + Caching |
| Analytics | Plausible | Cookie-frei, kein Banner nötig |

## Module

### 1. Public Site (`app/(marketing)/`)
Landing, Pricing, About, Login. SEO-optimiert, statisch generiert.

### 2. Tracer Studio (`app/(studio)/`)
- `/studio/onboarding` — Briefing-Form (CI, Branding, Themen-Schwerpunkte)
- `/studio/dashboard` — Kalender, kommende Posts, Approval
- `/studio/library` — Asset-Bibliothek (alle generierten Bilder)
- `/studio/settings` — Brand-Assets, Logo-Upload, Stilvorgaben

### 3. Tracer Brief (`app/(brief)/`)
- `/brief` — Newsletter-Landingpage mit Signup
- `/brief/archive` — alle Ausgaben (statisch via Beehiiv API)
- `/brief/[slug]` — Einzelausgabe als Webview

### 4. Backend Cron (`app/api/cron/`)
- `cron/sources/scrape` — täglich 04:00 UTC, neue Items aus Quellen
- `cron/brief/draft` — Sonntag 18:00, AI-Draft erstellen, Approval-Mail an Owner
- `cron/brief/publish` — Montag 06:00, falls Draft approved → Beehiiv-Push
- `cron/studio/generate` — Mittwoch 09:00, für jeden aktiven Kunden Bild + Post für nächste KW

### 5. Datenmodell (Supabase)

```sql
-- Tracer Studio (B2B-Kunden)
customer            (id, email, stripe_customer_id, subscription_status, created_at, ...)
brand_profile       (id, customer_id, name, logo_url, primary_color, tone, focus_areas[], ...)
content_brief       (id, customer_id, kw, year, theme, status, image_url, post_text_de, post_text_en, approved_at)

-- Tracer Brief (Newsletter)
source              (id, name, url, type [rss|scrape|api], language, active)
news_item           (id, source_id, title, url, content, fetched_at, language, embedding vector(1536))
brief_issue         (id, kw, year, language, draft_md, final_md, status, beehiiv_post_id, sent_at)
brief_item          (id, issue_id, news_item_id, summary, position)

-- Cross
sponsor             (id, name, contact_email, ...)
sponsor_slot        (id, issue_id, sponsor_id, price_eur, copy_md, paid_at)
```

## Datenfluss Tracer Brief (wöchentlich)

```
Mo–Sa     Cron crawlt Quellen → news_item-Tabelle
          Embeddings (Voyage/OpenAI) für Dedupe + Themen-Cluster

So 18:00  Cron ruft Claude Sonnet 4.6:
          - Items der letzten 7 Tage clustern
          - Top 5–7 wählen (Relevanz × Aktualität × Diversität)
          - Beide Sprachen zusammenfassen
          → brief_issue-Draft → Mail an Owner mit Approve-Link

Mo 06:00  Falls approved → Beehiiv Post API
          Newsletter geht an Subscriber-Liste raus
```

## Datenfluss Tracer Studio (pro Kunde, wöchentlich)

```
Mi 09:00  Cron pro aktiven Kunden:
          1. Brand-Profile + Themen-Pool laden
          2. Theme-Picker (LLM): KW-Thema basierend auf Branche + aktuellen news_items
          3. Image-Pipeline (analog RNZ-Code): Prompt → Replicate → Watermark
          4. Post-Text-Generator: Caption DE/EN, Hashtags
          5. content_brief mit status=pending speichern
          6. Notification (Mail) an Kunde mit Approve-Link
          7. Kunde approved im Dashboard oder per Mail-Klick
          8. Optional ab v2: Auto-Post via LinkedIn API
```

## Sicherheit & Compliance

- **DSGVO**: AVV mit Supabase, Vercel, Stripe, Beehiiv (alle bieten Standard-AVVs)
- **Datenresidenz**: Supabase EU-Region (`eu-central-1`)
- **Health-Daten**: Wir verarbeiten **keine** Patientendaten, nur Marketing-Content. Reduziert HIPAA/MPG-Komplexität auf nahe null.
- **Impressum/AGB/Datenschutz**: Templates initial generiert, einmalig anwaltlich gegenlesen (~300 €)
- **Cookie-Consent**: nur essenzielle Cookies → kein Banner nötig (Plausible statt GA)
- **Secrets**: ausschließlich in Vercel Env Vars, nie im Repo. `.env.local` in `.gitignore`.
