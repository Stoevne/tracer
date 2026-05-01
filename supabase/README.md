# Supabase Setup

## Migration einspielen

**Variante A — SQL-Editor (einfachster Weg für KW 1):**

1. https://supabase.com/dashboard → Projekt → **SQL Editor**
2. Inhalt von `migrations/0001_init.sql` reinkopieren
3. **Run**

**Variante B — psql:**

```bash
# Connection-String aus Supabase: Settings → Database → Connection string (URI)
psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  -f supabase/migrations/0001_init.sql
```

**Variante C — Supabase CLI (ab KW 5 sinnvoll, wenn Migrationen häufiger werden):**

```bash
supabase login
supabase link --project-ref [REF]
supabase db push
```

## Verifikation

Nach dem Einspielen sollten folgende Tabellen existieren:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Erwartet: `brand_profile`, `brief_issue`, `customer`, `news_item`, `subscriber`.

## Sicherheits-Setup

- RLS ist auf allen Tabellen aktiv. Schreibzugriffe laufen über den
  `SUPABASE_SERVICE_ROLE_KEY` (Server-only, niemals im Browser).
- Anon-Key kann *aktuell nichts* lesen oder schreiben — das ist Absicht. Sobald
  Kunden-Logins existieren, kommen Policies dazu.

## Backup

Supabase Free-Tier macht tägliche Auto-Backups (7 Tage Retention). Für
Production ggf. auf Pro-Plan upgraden, sobald echte Subscriber drin sind.
