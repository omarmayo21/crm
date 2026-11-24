-- ============================================================================
-- OPTIONAL DEMO DATA SEED SCRIPT (DO NOT RUN IN PRODUCTION UNLESS TESTING)
-- Run this in the Supabase SQL Editor AFTER signing up your user account if you
-- want sample multi-country leads to test with.
--
-- To delete all demo leads created by this script at any time, run:
--   DELETE FROM public.leads WHERE name LIKE '%[DEMO]%';
-- ============================================================================

do $$
declare
  v_user_id uuid;
  v_lead_1 uuid := gen_random_uuid();
  v_lead_2 uuid := gen_random_uuid();
  v_lead_3 uuid := gen_random_uuid();
begin
  select id into v_user_id from auth.users order by created_at asc limit 1;

  if v_user_id is null then
    raise exception 'No user found in auth.users. Sign up in the CRM app first, then run this seed script.';
  end if;

  -- Lead 1: Overdue follow-up in New Cairo (Egypt, EGP)
  insert into public.leads (
    id, user_id, name, phone, secondary_phone, country, source,
    request_type, property_type, area, budget, currency, status,
    next_follow_up_at, last_call_at
  ) values (
    v_lead_1, v_user_id, 'Tarek El-Masry [DEMO]', '+201012345678', '+201223456789',
    'EG', 'Facebook', 'Buy', 'Villa', 'New Cairo', 18500000, 'EGP', 'Needs Follow-up',
    now() - interval '3 hours', now() - interval '1 day'
  ) on conflict do nothing;

  insert into public.calls (user_id, lead_id, called_at, outcome, feedback, next_follow_up_at)
  values (
    v_user_id, v_lead_1, now() - interval '1 day', 'Answered',
    'Interested in 4BR standalone villa in 5th Settlement; asked for payment plan.',
    now() - interval '3 hours'
  );

  insert into public.notes (user_id, lead_id, content)
  values (
    v_user_id, v_lead_1,
    'Cash + 5-year installment buyer. Prefers corner plot facing north.'
  );

  -- Lead 2: Due today follow-up in Dubai Marina (UAE, AED)
  insert into public.leads (
    id, user_id, name, phone, secondary_phone, country, source,
    request_type, property_type, area, budget, currency, status,
    next_follow_up_at, last_call_at
  ) values (
    v_lead_2, v_user_id, 'Khalid Al-Mansoor [DEMO]', '+971501234567', null,
    'AE', 'Referral', 'Invest', 'Apartment', 'Dubai Marina', 3200000, 'AED', 'Viewing Scheduled',
    now() + interval '2 hours', now() - interval '2 days'
  ) on conflict do nothing;

  insert into public.calls (user_id, lead_id, called_at, outcome, feedback, next_follow_up_at)
  values (
    v_user_id, v_lead_2, now() - interval '2 days', 'Answered',
    'Confirmed viewing for marina-front 2BR unit.',
    now() + interval '2 hours'
  );

  -- Lead 3: Sheikh Zayed inquiry (Egypt, EGP)
  insert into public.leads (
    id, user_id, name, phone, secondary_phone, country, source,
    request_type, property_type, area, budget, currency, status,
    next_follow_up_at, last_call_at
  ) values (
    v_lead_3, v_user_id, 'Nourhan Adel [DEMO]', '+201112223344', null,
    'EG', 'Ads', 'Buy', 'Apartment', 'Sheikh Zayed', 9200000, 'EGP', 'No Answer',
    now() - interval '45 minutes', now() - interval '4 hours'
  ) on conflict do nothing;

  insert into public.calls (user_id, lead_id, called_at, outcome, feedback, next_follow_up_at)
  values (
    v_user_id, v_lead_3, now() - interval '4 hours', 'No Answer',
    'Rung twice, no answer. Retry this afternoon.',
    now() - interval '45 minutes'
  );
end $$;
