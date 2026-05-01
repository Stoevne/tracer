# Tracer

Automatisierte Editorial-Inhalte für Radiologie, Nuklearmedizin & Bildgebung.

## Zwei Produkte, eine Plattform

- **Tracer Studio** — SaaS, der wöchentlich CI-konforme LinkedIn-Editorial-Bilder + Posts für Praxen und MedTech-Firmen generiert
- **Tracer Brief** — wöchentlicher Newsletter (DE/EN) zu KI, Bildgebung und MedTech-Trends

Newsletter-Subscriber sind warme Leads für den SaaS. Die SaaS-Pipeline liefert (anonymisiert) Content-Ideen für den Newsletter. Eine Codebase, ein Deployment, zwei Einnahmequellen.

## Status

Pre-Launch. Skelett liegt aktuell als Unterordner im Repo `stoevne/rnz-linkedin-images` auf Branch `claude/automated-income-system-mjIdE`.
**Vor dem ersten echten Coding-Sprint folge `docs/MIGRATION.md`** — der Code zieht in ein eigenes Repo um.

## Dokumentation

- `docs/SYSTEM.md` — Architektur, Stack, Datenfluss
- `docs/ROADMAP.md` — 12-Wochen-Plan
- `docs/MIGRATION.md` — Schritt-für-Schritt-Anleitung für die Übersiedlung ins neue Repo

## Quick Start (nach Migration)

```bash
npm install
cp .env.example .env.local
# .env.local mit API-Keys aus Supabase füllen
npm run dev
```
