-- =============================================================================
-- KW 9 — Sponsor-Pipeline
-- =============================================================================

create table if not exists sponsor (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_email text not null,
  website_url   text,
  notes         text,
  created_at    timestamptz not null default now()
);

create unique index if not exists sponsor_email_unique
  on sponsor (lower(contact_email));

create table if not exists sponsor_slot (
  id                       uuid primary key default gen_random_uuid(),
  sponsor_id               uuid not null references sponsor(id) on delete restrict,
  target_kw                int  not null,
  target_year              int  not null,
  target_language          text not null check (target_language in ('de', 'en')),
  copy_md                  text not null,
  cta_url                  text,
  price_eur_cents          int  not null,
  stripe_session_id        text,
  paid_at                  timestamptz,
  inserted_into_issue_id   uuid references brief_issue(id) on delete set null,
  created_at               timestamptz not null default now()
);

create index if not exists sponsor_slot_target_idx
  on sponsor_slot (target_year, target_kw, target_language)
  where paid_at is not null;

create index if not exists sponsor_slot_pending_insert
  on sponsor_slot (target_year, target_kw, target_language)
  where paid_at is not null and inserted_into_issue_id is null;

alter table sponsor      enable row level security;
alter table sponsor_slot enable row level security;
