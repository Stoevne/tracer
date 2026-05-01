-- =============================================================================
-- KW 5 — Sources, Embeddings, Brief-Items
-- =============================================================================

create extension if not exists vector;

-- -----------------------------------------------------------------------------
-- source — News-Quellen für Tracer Brief
-- -----------------------------------------------------------------------------
create table if not exists source (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null,
  type        text not null default 'rss' check (type in ('rss', 'atom', 'scrape', 'api')),
  language    text not null default 'en' check (language in ('de', 'en')),
  active      boolean not null default true,
  last_fetched_at timestamptz,
  fetch_error text,
  created_at  timestamptz not null default now()
);

create unique index if not exists source_url_unique on source (url);

-- -----------------------------------------------------------------------------
-- news_item: source_id-FK + Embedding
-- -----------------------------------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'news_item_source_fk'
  ) then
    alter table news_item
      add constraint news_item_source_fk
      foreign key (source_id) references source(id) on delete set null;
  end if;
end $$;

alter table news_item add column if not exists embedding vector(1024);

create index if not exists news_item_embedding_idx
  on news_item using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- -----------------------------------------------------------------------------
-- brief_item — verbindet brief_issue + news_item mit Position + Summary
-- -----------------------------------------------------------------------------
create table if not exists brief_item (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null references brief_issue(id) on delete cascade,
  news_item_id uuid references news_item(id) on delete set null,
  position     int not null,
  summary_md   text,
  created_at   timestamptz not null default now(),
  unique (issue_id, position)
);

create index if not exists brief_item_issue_idx on brief_item (issue_id);

alter table source     enable row level security;
alter table brief_item enable row level security;
