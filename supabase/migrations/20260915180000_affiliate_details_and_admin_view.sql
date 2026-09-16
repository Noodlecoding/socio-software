-- Self-reported affiliate details (age 18+ enforced client-side only, no ID
-- verification) collected on the "Become an Affiliate" step.
alter table public.affiliates add column age integer;
alter table public.affiliates add column country text;

-- Admin dashboard: surface full affiliate info (name/email/age/country/stats),
-- not just the aggregate numbers the affiliate's own dashboard needs.
drop view if exists public.affiliate_stats;

create view public.affiliate_stats as
select
  a.id as affiliate_id,
  a.full_name,
  a.email,
  a.age,
  a.country,
  a.referral_code,
  a.created_at,
  count(p.id) as leads_count,
  count(p.id) filter (where p.status = 'paid') as deals_closed,
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) as total_deal_value,
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 as commission_owed
from public.affiliates a
left join public.profiles p on p.referred_by = a.referral_code
group by a.id, a.full_name, a.email, a.age, a.country, a.referral_code, a.created_at;

alter view public.affiliate_stats set (security_invoker = true);

grant select on public.affiliate_stats to authenticated;

-- Client list (admin dashboard): show which affiliate, if any, referred each client.
drop view if exists public.admin_conversations;

create view public.admin_conversations as
select
  p.id as user_id,
  p.full_name,
  p.organization,
  p.status,
  p.created_at as client_since,
  p.referred_by,
  aff.email as affiliate_email,
  aff.full_name as affiliate_name,
  (
    select count(*) from public.messages m
    where m.user_id = p.id and m.sender = 'user' and m.read_by_admin = false
  ) as unread_count,
  (
    select m.text from public.messages m
    where m.user_id = p.id
    order by m.created_at desc
    limit 1
  ) as last_message,
  (
    select m.created_at from public.messages m
    where m.user_id = p.id
    order by m.created_at desc
    limit 1
  ) as last_message_at
from public.profiles p
left join public.affiliates aff on aff.referral_code = p.referred_by;

alter view public.admin_conversations set (security_invoker = true);

grant select on public.admin_conversations to authenticated;
