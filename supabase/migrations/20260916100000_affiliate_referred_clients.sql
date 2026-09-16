-- Both dashboards only ever showed one aggregate number (total commission
-- owed, total deals closed) with no way to see which specific referred
-- client contributed what — effectively only usable for a single client at
-- a glance. This view gives a per-client breakdown for an affiliate's
-- referrals. It relies entirely on profiles' existing RLS (own row / admin /
-- affiliate-of-referred-client) via security_invoker, so an affiliate only
-- ever sees their own referred clients and the admin sees everyone — no new
-- data exposure beyond what those policies already permit.
create view public.affiliate_referred_clients as
select
  p.id as user_id,
  a.id as affiliate_id,
  p.full_name,
  p.organization,
  p.status,
  p.deal_value,
  p.created_at as client_since,
  case when p.status = 'paid' then coalesce(p.deal_value, 0) * 0.23 else 0 end as commission_contribution
from public.profiles p
join public.affiliates a on a.referral_code = p.referred_by
where p.account_type = 'client';

alter view public.affiliate_referred_clients set (security_invoker = true);

grant select on public.affiliate_referred_clients to authenticated;
