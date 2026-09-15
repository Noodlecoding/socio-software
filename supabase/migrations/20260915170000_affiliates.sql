-- Referral attribution on clients, and the deal value the admin records once a
-- deal closes (drives commission calculation).
alter table public.profiles add column referred_by text;
alter table public.profiles add column deal_value numeric;

-- Pass through the referral code captured at signup time, if any.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, organization, selected_model, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'organization',
    coalesce(new.raw_user_meta_data->>'selected_model', 'core-workflow'),
    new.raw_user_meta_data->>'referred_by'
  );
  return new;
end;
$$;

-- Affiliates: one row per affiliate account, created client-side (not via the
-- auth trigger) so an existing signed-in client can also register as an
-- affiliate without creating a second auth user.
create table public.affiliates (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  referral_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;

create policy "Affiliate can view own row"
  on public.affiliates for select
  using ((select auth.uid()) = id);

create policy "Affiliate can insert own row"
  on public.affiliates for insert
  with check ((select auth.uid()) = id);

create policy "Admin can view all affiliates"
  on public.affiliates for select
  using ((select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com');

grant select, insert on public.affiliates to authenticated;

-- Let an affiliate see (only) the client profiles they referred, so their
-- dashboard can compute stats. Replaces the prior consolidated select policy.
drop policy if exists "View own profile or admin views all" on public.profiles;

create policy "View own profile, admin, or affiliate of referred client"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
    or exists (
      select 1 from public.affiliates a
      where a.id = (select auth.uid())
        and a.referral_code = profiles.referred_by
    )
  );

-- Aggregated per-affiliate stats. security_invoker so an affiliate only ever
-- sees their own row (enforced by the affiliates RLS policy above).
create view public.affiliate_stats as
select
  a.id as affiliate_id,
  a.referral_code,
  count(p.id) as leads_count,
  count(p.id) filter (where p.status = 'paid') as deals_closed,
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) as total_deal_value,
  coalesce(sum(p.deal_value) filter (where p.status = 'paid'), 0) * 0.23 as commission_owed
from public.affiliates a
left join public.profiles p on p.referred_by = a.referral_code
group by a.id, a.referral_code;

alter view public.affiliate_stats set (security_invoker = true);

grant select on public.affiliate_stats to authenticated;
