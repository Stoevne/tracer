-- =============================================================================
-- KW 7 — Semantic Search RPC für Theme-Picker
-- =============================================================================
-- Nimmt einen Query-Embedding-Vektor + Sprache + Limit, liefert news_items
-- sortiert nach Cosine-Distance (kleinster Wert = ähnlichst).

create or replace function semantic_news(
  query_embedding vector(1024),
  lang text,
  n int default 20
)
returns table (
  id uuid,
  title text,
  url text,
  content text,
  published_at timestamptz,
  distance float
)
language sql
stable
as $$
  select
    id,
    title,
    url,
    content,
    published_at,
    (embedding <=> query_embedding)::float as distance
  from news_item
  where embedding is not null
    and language = lang
    and fetched_at > now() - interval '14 days'
  order by embedding <=> query_embedding
  limit n;
$$;

-- Erlaube authenticated und service_role den Aufruf
grant execute on function semantic_news(vector, text, int) to anon, authenticated, service_role;
