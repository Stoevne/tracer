# Tracer — 12-Wochen-Roadmap

Jede Woche genau **ein Vertical Slice**: deploybar, sichtbar, von dir testbar.

## KW 1 — Foundation
- Repo-Setup, Vercel-Deploy, Domain verknüpft
- Supabase-Projekt (EU-Region), initiale Migration für `customer`, `brand_profile`, `news_item`, `brief_issue`
- Tailwind, Layout, Brand-Identität (vorerst Wordmark — Logo-Iteration später via Tracer Studio selbst)
- **Output**: Live-URL mit Coming-Soon-Page + Newsletter-Signup-Form

## KW 2 — Studio: Bildgen-Service
- Bestehende RNZ-Pipeline (`kw17`-Stand) generisch portieren
- Replicate-Integration, FLUX 1.1 Pro
- Watermark-Logic auf `brand_profile` parametrisieren
- **Output**: API-Endpunkt `POST /api/studio/generate`, manuell triggerbar

## KW 3 — Studio: Onboarding
- Briefing-Form (Branche, CI-Farben, Logo-Upload via Supabase Storage, Themen-Schwerpunkte)
- Brand-Profile in DB speichern
- Erstes Bild on-demand generieren als "Hello World"
- **Output**: User kann sich anmelden, Briefing ausfüllen, ein Probebild bekommen

## KW 4 — Stripe + Pricing
- Drei Tarife: Solo (49 €/Mo), Praxis (99 €/Mo), Team (199 €/Mo)
- Stripe Checkout + Customer Portal
- 14-Tage-Trial, Webhook für Subscription-Status
- **Output**: User kann zahlen, Subscription-Status synct in DB

## KW 5 — Brief: Source-Pipeline
- Quellen-Liste: RSNA, ECR, AuntMinnie, Radiology AI News, dt. Ärzteblatt MedTech, BfS, EANM, JNM, EJNMMI, …
- Cron-Scraper (täglich 04:00 UTC), `news_item`-Tabelle
- Embeddings (Voyage `voyage-3`) für Dedupe + Themen-Cluster
- **Output**: DB füllt sich täglich, Admin-View zeigt Items

## KW 6 — Brief: Draft & Approve
- LLM-Curator (Claude Sonnet 4.6): Top-Items wählen, beide Sprachen zusammenfassen, Markdown-Draft
- Mail an Owner mit Approve-Link (Magic-Token)
- Beehiiv-API für Versand
- **Output**: Erste echte Newsletter-Ausgabe (an dich + 2–3 Tester)

## KW 7 — Studio: Wöchentliche Generation
- Cron-Job Mi 09:00, generiert für alle aktiven Kunden
- Theme-Picker nutzt aktuelle `news_item`-Cluster
- Mail-Notification an Kunde mit Approve-Link
- Approval-Dashboard (`/studio/dashboard`)
- **Output**: Vollautomatischer Wochen-Loop für SaaS-Kunden

## KW 8 — Customer-Self-Service
- Customer-Portal (Brand-Assets ändern, Themen-Pool, Pause-Button)
- AI-Support-Bot (Crisp + Claude, Wissensbasis = SYSTEM.md + FAQ)
- Onboarding-Mailsequenz (Day 0/1/3/7/14)
- **Output**: Neuer Kunde kann komplett ohne dich starten

## KW 9 — Brief: Sponsoren-Pipeline
- Sponsor-Submission-Formular (`/brief/sponsor`)
- Stripe-Payment für Slot-Booking
- Auto-Insert in nächste Ausgabe (mit "Anzeige"-Kennzeichnung)
- **Output**: Sponsor kann selbst buchen + zahlen, ohne dich

## KW 10 — Landing & SEO
- Marketing-Site (Pricing, About, Case Studies)
- Newsletter-Signup als Lead-Magnet ("Get Tracer Brief — wöchentlich")
- Plausible Analytics, Sitemap, strukturierte Daten
- Open-Graph-Bilder generiert via Tracer Studio selbst (Meta-Beweis)
- **Output**: Conversion-fähige Landing

## KW 11 — Soft Launch
- Outreach an 10–20 Praxen/MedTech-Kontakte (Cold-DM, persönlich)
- Erste 2 Beta-Kunden onboarden, Feedback einbauen
- **Output**: 2 zahlende Kunden + Tracer Brief auf 100+ Subscriber

## KW 12 — Public Launch
- Pressemitteilung an radiologische Fachpublikationen (Radiologie Heute, Diagnostic Imaging Europe, AuntMinnie Europe)
- LinkedIn-Launch-Post auf deinem Profil + RNZ-Profil
- Erste Sponsor-Akquise per Mail an gewählte MedTech-Firmen
- **Output**: Public-Launch-Spike, Pipeline läuft

## Nach KW 12

Wartung ~2 h/Woche. Skalierung primär durch:
1. **Newsletter-Wachstum** organisch + bezahlte Slots auf adjacent Newslettern (RBMA, AuntMinnie)
2. **Sales-Outreach** durch dich (5 DMs/Woche)
3. **Content-Marketing** aus Brief-Archiv — jede Ausgabe wird SEO-Asset
4. **Affiliate** für komplementäre Tools (Praxisverwaltung, KI-Befundungs-Tools)

## Realistisches Erlös-Szenario

| Monat | SaaS-Kunden | Sponsor-Slots/Mo | MRR |
|---|---|---|---|
| 3 | 2 (Beta) | 0 | 200 € |
| 6 | 8 | 1 × 800 € | ~1.500 € |
| 12 | 25 | 2 × 1.000 € | ~4.500 € |
| 18 | 50 | 3 × 1.200 € | ~9.500 € |

Konservativ kalkuliert. Bei stärkerem Newsletter-Wachstum (>5k Subscriber) skalieren Sponsor-Preise überproportional.
