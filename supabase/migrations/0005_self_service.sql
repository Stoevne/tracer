-- =============================================================================
-- KW 8 — Self-Service: Pause + Onboarding-Mail-Log
-- =============================================================================

alter table customer
  add column if not exists paused_at timestamptz,
  add column if not exists onboarded_at timestamptz default now();

create index if not exists customer_paused_idx
  on customer (paused_at) where paused_at is null;

create table if not exists onboarding_mail_log (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id) on delete cascade,
  day         int  not null,
  sent_at     timestamptz not null default now(),
  unique (customer_id, day)
);

alter table onboarding_mail_log enable row level security;
