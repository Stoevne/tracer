-- =============================================================================
-- Tracer — Initial Schema
-- =============================================================================
-- Idempotent. Im Supabase-SQL-Editor einmal ausführen oder via psql:
--   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
--
-- Region: eu-central-1 (Frankfurt)
-- Erweiterungen: pgcrypto für gen_random_uuid(); pgvector kommt erst in KW 5.

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Newsletter-Signups (Tracer Brief)
-- -----------------------------------------------------------------------------
-- Eigene Tabelle, getrennt vom Beehiiv-Subscriber-Mgmt: hier landen die
-- Coming-Soon-Signups, bevor Beehiiv (KW 6) angebunden ist. Später syncen
-- wir confirmed=true Subscriber dorthin und behalten diese Tabelle als Quelle.

create table if not exists subscriber (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  language      text not null default 'de' check (language in ('de', 'en')),
  source        text not null default 'coming_soon',
  confirmed_at  timestamptz,
  unsubscribed_at timestamptz,
  ip_hash       text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create unique index if not exists subscriber_email_unique
  on subscriber (lower(email));

create index if not exists subscriber_created_at_idx
  on subscriber (created_at desc);

-- -----------------------------------------------------------------------------
-- Tracer Studio (B2B-Kunden)
-- -----------------------------------------------------------------------------

create table if not exists customer (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null unique,
  stripe_customer_id   text unique,
  subscription_status  text not null default 'inactive'
    check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  subscription_tier    text check (subscription_tier in ('solo', 'praxis', 'team')),
  trial_ends_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists customer_status_idx
  on customer (subscription_status);

create table if not exists brand_profile (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customer(id) on delete cascade,
  name            text not null,
  logo_url        text,
  primary_color   text,
  tone            text,
  focus_areas     text[] not null default '{}',
  language        text not null default 'de' check (language in ('de', 'en', 'both')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists brand_profile_customer_idx
  on brand_profile (customer_id);

-- -----------------------------------------------------------------------------
-- Tracer Brief (Newsletter)
-- -----------------------------------------------------------------------------

create table if not exists news_item (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid,
  title        text not null,
  url          text not null,
  content      text,
  language     text not null default 'en' check (language in ('de', 'en')),
  fetched_at   timestamptz not null default now(),
  published_at timestamptz,
  -- embedding vector(1536) — wird in KW 5 hinzugefügt, sobald pgvector aktiviert
  created_at   timestamptz not null default now()
);

create unique index if not exists news_item_url_unique
  on news_item (url);

create index if not exists news_item_fetched_at_idx
  on news_item (fetched_at desc);

create table if not exists brief_issue (
  id              uuid primary key default gen_random_uuid(),
  kw              int  not null,
  year            int  not null,
  language        text not null check (language in ('de', 'en')),
  draft_md        text,
  final_md        text,
  status          text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'sent', 'rejected')),
  beehiiv_post_id text,
  approved_at     timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (kw, year, language)
);

create index if not exists brief_issue_status_idx
  on brief_issue (status);

-- -----------------------------------------------------------------------------
-- updated_at-Trigger
-- -----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists customer_set_updated_at on customer;
create trigger customer_set_updated_at
  before update on customer
  for each row execute function set_updated_at();

drop trigger if exists brand_profile_set_updated_at on brand_profile;
create trigger brand_profile_set_updated_at
  before update on brand_profile
  for each row execute function set_updated_at();

drop trigger if exists brief_issue_set_updated_at on brief_issue;
create trigger brief_issue_set_updated_at
  before update on brief_issue
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------
-- Default-Deny via RLS — alle Schreiboperationen laufen über den
-- service-role-Client, der RLS umgeht. Lesen ist für anon hier (noch) tabu.
-- Sobald Kunden-Logins existieren (KW 3+), kommen explizite Policies pro
-- customer_id dazu.

alter table subscriber     enable row level security;
alter table customer       enable row level security;
alter table brand_profile  enable row level security;
alter table news_item      enable row level security;
alter table brief_issue    enable row level security;
