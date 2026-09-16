-- Track how many times an affiliate's referral link has been visited.
-- Visitors clicking the link haven't signed up (or even signed in) yet, so
-- recording a click needs to work for anonymous callers — a SECURITY
-- DEFINER function that only ever increments one counter by exactly 1 for a
-- given referral code, same pattern as check_auth_rate_limit.
alter table public.affiliates add column click_count integer not null default 0;

create function public.record_affiliate_link_click(p_referral_code text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.affiliates set click_count = click_count + 1 where referral_code = p_referral_code;
end;
$$;

revoke execute on function public.record_affiliate_link_click(text) from public;
grant execute on function public.record_affiliate_link_click(text) to anon, authenticated;

-- Surface it alongside the rest of the affiliate's stats (appended at the
-- end — CREATE OR REPLACE VIEW can add columns but not reorder existing ones).
create or replace view public.affiliate_stats as
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
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 as total_commission_earned,
  a.paid_out,
  greatest(
    coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 - a.paid_out,
    0
  ) as commission_owed,
  a.click_count
from public.affiliates a
left join public.profiles p on p.referred_by = a.referral_code
group by a.id, a.full_name, a.email, a.age, a.country, a.referral_code, a.created_at, a.paid_out, a.click_count;

alter view public.affiliate_stats set (security_invoker = true);

grant select on public.affiliate_stats to authenticated;
