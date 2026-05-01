# Migration: tracer/ → eigenes Repo

Dieses Skelett liegt aktuell als Unterordner im Repo `stoevne/rnz-linkedin-images` auf Branch `claude/automated-income-system-mjIdE` — nur ein Übergangsort. Folgende Schritte überführen es in das finale eigene Repo.

**Geschätzte Gesamtdauer: ~25 Minuten**, einmalig.

---

## Schritt 1 — Domain registrieren (5 min)

Bei **Cloudflare Registrar** (günstigster Marktplatz, ~10 €/Jahr):

1. Gehe auf https://dash.cloudflare.com → Registrar
2. Domains in Reihenfolge prüfen, **erste verfügbare nehmen**:
   1. `tracer.studio`
   2. `tracer.health`
   3. `gettracer.com`
   4. `usetracer.com`
3. Registrieren, Bezahlung durchziehen
4. Domain notieren — brauchen wir in Schritt 5

> Falls *alle vier* schon vergeben sind, melde dich kurz — wir nehmen dann eine der Backup-Marken (Voxel oder Penumbra).

---

## Schritt 2 — GitHub-Repo erstellen (2 min)

1. Gehe auf https://github.com/new
2. **Repository name**: `tracer`
3. **Owner**: `stoevne`
4. **Visibility**: Private (kann später public werden)
5. **WICHTIG**: Nichts auswählen — kein README, kein .gitignore, keine Lizenz. **Komplett leer.**
6. "Create repository" klicken
7. Auf der nächsten Seite die SSH-URL kopieren — sieht so aus:
   ```
   git@github.com:stoevne/tracer.git
   ```

---

## Schritt 3 — Skelett aus diesem Repo herauslösen (5 min)

Im Terminal auf deinem Rechner. **Pfade unten an deine Umgebung anpassen** — `~/path/to/rnz-linkedin-images` ist Platzhalter.

```bash
# 1. Sicherstellen, dass dein lokales rnz-linkedin-images den aktuellen Branch hat
cd ~/path/to/rnz-linkedin-images
git fetch origin
git checkout claude/automated-income-system-mjIdE
git pull origin claude/automated-income-system-mjIdE

# 2. Neues, leeres Verzeichnis fürs neue Repo
mkdir -p ~/dev/tracer
cd ~/dev/tracer

# 3. Initialisieren und mit GitHub verknüpfen
git init -b main
git remote add origin git@github.com:stoevne/tracer.git

# 4. Skelett rüberkopieren (der Punkt am Ende ist wichtig — kopiert auch Dot-Files)
cp -r ~/path/to/rnz-linkedin-images/tracer/. .

# 5. Sanity-Check: Liegt alles drin?
ls -la
```

**Erwartete Top-Level-Einträge**:
```
.env.example     .gitignore       README.md
app/             docs/            lib/
package.json     postcss.config.mjs
next.config.mjs  tailwind.config.ts
tsconfig.json
```

```bash
# 6. Initial-Commit
git add .
git commit -m "Initial scaffold: Tracer Studio + Tracer Brief"
git push -u origin main
```

✅ Wenn der Push ohne Fehler durchläuft: das neue Repo ist live auf GitHub.

---

## Schritt 4 — Vercel-Projekt anlegen (3 min)

1. Gehe auf https://vercel.com/new
2. "Import Git Repository" → `stoevne/tracer` auswählen
   - Falls nicht da: "Adjust GitHub App Permissions" und Repo freigeben
3. **Framework Preset**: Next.js (sollte auto-erkannt werden)
4. **Root Directory**: leer lassen (Repo-Root)
5. **Environment Variables**: vorerst überspringen (Schritt 6)
6. "Deploy" klicken
7. Nach ~1 min: Vercel-Default-URL kopieren — z.B. `tracer-xyz.vercel.app`

> Erster Build könnte fehlschlagen, weil noch keine Env-Vars gesetzt sind. Das ist okay — wir reparieren das in Schritt 6.

---

## Schritt 5 — Domain mit Vercel verbinden (3 min)

1. Im Vercel-Projekt: **Settings → Domains**
2. Deine in Schritt 1 registrierte Domain eintragen → "Add"
3. Vercel zeigt 1–2 DNS-Records, die gesetzt werden müssen (meist ein `A` und ein `CNAME`)
4. Bei Cloudflare: **DNS → Records → Add record** gemäß Vercel-Anweisung
   - Wichtig: bei Cloudflare den **Proxy-Status auf "DNS only" (graue Wolke)** setzen, sonst hadert Vercel mit dem Cert
5. Zurück bei Vercel warten, bis "Valid Configuration" angezeigt wird (meist <5 min, max 30)

---

## Schritt 6 — API-Keys beschaffen & einsetzen (5 min für KW 1)

In `.env.example` siehst du **alle** Keys, die wir über die 12 Wochen brauchen. Für KW 1 (Coming-Soon-Page + DB) reichen drei:

| Key | Wo holen | Wann nötig |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | deine Domain (z.B. `https://tracer.studio`) | KW 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | https://supabase.com → New Project → **Region: Frankfurt (eu-central-1)** | KW 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API → anon/public | KW 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API → service_role (geheim!) | KW 1 |

Den Rest (Stripe, Replicate, Beehiiv, Anthropic, Voyage) holen wir, wenn die jeweiligen Module gebaut werden — du musst nicht alles am Anfang besorgen.

**Eintragen in Vercel**:
1. Vercel-Projekt → Settings → **Environment Variables**
2. Jeden Key einzeln hinzufügen
3. **Scope**: Production + Preview + Development (alle drei anhaken)
4. Nach allen Keys: **Deployments → letzten Build → "..." → Redeploy**

---

## Schritt 7 — Aufräumen (optional, später)

Sobald das neue Repo läuft und wir mehrere Wochen drin entwickelt haben, kann der `tracer/`-Ordner aus `rnz-linkedin-images` entfernt werden:

```bash
cd ~/path/to/rnz-linkedin-images
git checkout main
git rm -r tracer/
git commit -m "Remove tracer/ scaffold (migrated to own repo)"
git push origin main

# Branch kann auch gelöscht werden:
git push origin --delete claude/automated-income-system-mjIdE
git branch -D claude/automated-income-system-mjIdE
```

---

## Was kommt danach

Schreib mir, sobald die Schritte 1–6 durch sind und Vercel "Valid Configuration" für deine Domain zeigt. Dann:

1. Wir öffnen eine **neue Claude-Session im neuen Repo** (`~/dev/tracer`)
2. Ich starte KW 1: Coming-Soon-Page mit Newsletter-Signup, Supabase-Schema, erste Migration
3. Du gibst frei → wir deployen → KW 2 kann beginnen

**Bei Problemen mit irgendeinem Schritt**: einfach in der Session melden mit der Fehlermeldung. Die meisten Stolpersteine (DNS, Vercel-Build, Supabase-Region) habe ich schon gesehen.
