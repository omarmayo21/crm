-- ============================================================================
-- REAL ESTATE SALES AGENT CALL-LOGGING CRM — SUPABASE POSTGRESQL SCHEMA
-- Paste this entire file into your Supabase Dashboard -> SQL Editor -> Run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SOURCES TABLE (Custom + default lead sources per user)
-- ----------------------------------------------------------------------------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint sources_user_name_unique unique (user_id, name)
);

-- ----------------------------------------------------------------------------
-- 2. LEADS TABLE (All phone numbers stored in canonical E.164 format)
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  phone text not null,              -- Canonical E.164 (e.g. +201012345678)
  secondary_phone text,             -- Optional canonical E.164
  country text,                     -- ISO 3166-1 alpha-2 country code (e.g. EG, AE, SA, GB, US)
  source text not null default 'Facebook',
  request_type text not null default 'Buy'
    check (request_type in ('Buy', 'Rent', 'Invest')),
  property_type text not null default 'Apartment',
  area text not null default '',
  budget numeric(15, 2),
  currency text not null default 'EGP'
    check (currency in ('EGP', 'USD', 'AED', 'SAR', 'GBP', 'EUR')),
  status text not null default 'New'
    check (status in (
      'New',
      'No Answer',
      'Interested',
      'Needs Follow-up',
      'Viewing Scheduled',
      'Negotiation',
      'Closed/Sold',
      'Not Interested',
      'Wrong Number'
    )),
  next_follow_up_at timestamptz,
  last_call_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Unique constraint on primary phone per user
  constraint leads_user_phone_unique unique (user_id, phone),
  -- Prevent primary and secondary phone on the same lead from being identical
  constraint leads_distinct_primary_secondary check (
    secondary_phone is null or secondary_phone <> phone
  )
);

-- Cross-column duplicate trigger: ensures neither phone nor secondary_phone
-- collides with any existing primary or secondary phone for the same user.
create or replace function public.check_lead_phone_duplicates()
returns trigger
language plpgsql
security definer
as $$
declare
  v_conflict_name text;
  v_conflict_phone text;
begin
  select l.name, l.phone
    into v_conflict_name, v_conflict_phone
    from public.leads l
   where l.user_id = new.user_id
     and (tg_op = 'INSERT' or l.id <> new.id)
     and (
       l.phone = new.phone
       or (l.secondary_phone is not null and l.secondary_phone = new.phone)
       or (new.secondary_phone is not null and l.phone = new.secondary_phone)
       or (new.secondary_phone is not null and l.secondary_phone is not null and l.secondary_phone = new.secondary_phone)
     )
   limit 1;

  if found then
    raise exception 'DUPLICATE_PHONE: Number already exists on lead "%" (%)', v_conflict_name, v_conflict_phone
      using errcode = '23505';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_check_lead_phone_duplicates on public.leads;
create trigger trg_check_lead_phone_duplicates
before insert or update on public.leads
for each row execute function public.check_lead_phone_duplicates();

-- ----------------------------------------------------------------------------
-- 3. CALLS TABLE (Call log timeline & feedback linked to a lead)
-- ----------------------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  called_at timestamptz not null default now(),
  outcome text not null
    check (outcome in ('Answered', 'No Answer', 'Busy', 'Switched Off', 'Rejected')),
  feedback text not null default '',
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. NOTES TABLE (General lead notes outside the call log, linked to a lead)
-- ----------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. INDEXES (Phone, Secondary Phone, Status, Next Follow-Up Date, Lead FKs)
-- ----------------------------------------------------------------------------
create index if not exists idx_leads_user_phone on public.leads (user_id, phone);
create index if not exists idx_leads_user_secondary_phone on public.leads (user_id, secondary_phone);
create index if not exists idx_leads_user_status on public.leads (user_id, status);
create index if not exists idx_leads_user_next_follow_up on public.leads (user_id, next_follow_up_at);
create index if not exists idx_leads_user_country on public.leads (user_id, country);
create index if not exists idx_calls_lead_called_at on public.calls (lead_id, called_at desc);
create index if not exists idx_notes_lead_created_at on public.notes (lead_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS — each salesperson sees only their own records)
-- ----------------------------------------------------------------------------
alter table public.sources enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;
alter table public.notes enable row level security;

-- SOURCES policies
drop policy if exists "Users manage own sources" on public.sources;
create policy "Users manage own sources"
  on public.sources
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- LEADS policies
drop policy if exists "Users manage own leads" on public.leads;
create policy "Users manage own leads"
  on public.leads
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- CALLS policies
drop policy if exists "Users manage own calls" on public.calls;
create policy "Users manage own calls"
  on public.calls
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTES policies
drop policy if exists "Users manage own notes" on public.notes;
create policy "Users manage own notes"
  on public.notes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
