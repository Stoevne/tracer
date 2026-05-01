-- =============================================================================
-- KW 2 — content_brief
-- =============================================================================
-- Eine Zeile pro generiertem Studio-Asset. Status-Lifecycle:
--   pending  → generated → approved → posted
--                 ↓
--              failed
--
-- image_url zeigt auf Supabase Storage (Bucket "studio-assets").

create table if not exists content_brief (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references customer(id) on delete cascade,
  kw              int  not null,
  year            int  not null,
  language        text not null default 'de' check (language in ('de', 'en')),
  theme           text not null,
  status          text not null default 'pending'
    check (status in ('pending', 'generated', 'approved', 'rejected', 'posted', 'failed')),
  image_url       text,
  image_storage_path text,
  prompt_used     text,
  post_text_de    text,
  post_text_en    text,
  error_message   text,
  approved_at     timestamptz,
  posted_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists content_brief_customer_idx
  on content_brief (customer_id);

create index if not exists content_brief_status_idx
  on content_brief (status);

create index if not exists content_brief_kw_year_idx
  on content_brief (year, kw);

drop trigger if exists content_brief_set_updated_at on content_brief;
create trigger content_brief_set_updated_at
  before update on content_brief
  for each row execute function set_updated_at();

alter table content_brief enable row level security;
