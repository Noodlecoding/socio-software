-- Commission owed was always computed purely from closed deals, with no way
-- to record that an affiliate has actually been paid — so it never went
-- back down. Track a running total paid out per affiliate; commission owed
-- becomes (total earned so far) minus (total paid out so far), so it
-- naturally goes back to 0 after a manual payout and correctly starts
-- climbing again only from new deals closed afterward.
alter table public.affiliates add column paid_out numeric not null default 0 check (paid_out >= 0);

drop view public.affiliate_stats;

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
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 as total_commission_earned,
  a.paid_out,
  greatest(
    coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 - a.paid_out,
    0
  ) as commission_owed
from public.affiliates a
left join public.profiles p on p.referred_by = a.referral_code
group by a.id, a.full_name, a.email, a.age, a.country, a.referral_code, a.created_at, a.paid_out;

alter view public.affiliate_stats set (security_invoker = true);

grant select on public.affiliate_stats to authenticated;

-- Affiliates never had an UPDATE policy at all, so non-admins can't update
-- any column on this table (no policy = no access) — admin-only by
-- construction, no extra column-level guard needed the way profiles has one.
create policy "Admin can update affiliates"
  on public.affiliates for update
  using ((select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com')
  with check ((select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com');

grant update on public.affiliates to authenticated;
