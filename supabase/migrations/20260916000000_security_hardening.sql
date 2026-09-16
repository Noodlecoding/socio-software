-- Affiliates had two separate permissive SELECT policies ("own row" and
-- "admin views all"), which Postgres has to evaluate as an OR on every row
-- read (Supabase lint: multiple permissive policies). Consolidate into one,
-- matching the pattern already used for profiles/messages/spec_files.
drop policy if exists "Affiliate can view own row" on public.affiliates;
drop policy if exists "Admin can view all affiliates" on public.affiliates;

create policy "View own affiliate row or admin views all"
  on public.affiliates for select
  using (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

-- handle_new_user only ever needs to run as the auth.users insert trigger
-- (which executes with the function owner's privileges regardless of grants).
-- It was left publicly executable, letting any signed-in or anonymous caller
-- invoke it directly and insert arbitrary profile rows. Lock it down.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- check_auth_rate_limit is meant to be called directly from client code
-- before signup/signin, so anon/authenticated need execute — but it doesn't
-- need to be world-executable via the implicit PUBLIC grant.
revoke execute on function public.check_auth_rate_limit(text, text) from public;
grant execute on function public.check_auth_rate_limit(text, text) to anon, authenticated;

-- rls_auto_enable is a project-level helper (not defined in our migrations)
-- that was left callable by anon/authenticated. It's not part of any
-- client-facing flow, so remove its public/anon/authenticated execute grants.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- The confirm-affiliate-email edge function now rate-limits itself through
-- check_auth_rate_limit (so an arbitrary userId/email pair can't be brute
-- forced), reusing the same per-identifier-per-action window as signup/signin.
alter table public.auth_attempts drop constraint auth_attempts_action_check;
alter table public.auth_attempts add constraint auth_attempts_action_check
  check (action in ('signup', 'signin', 'confirm_email'));

-- The edge function calls check_auth_rate_limit with the service-role key,
-- but grant execute to service_role explicitly too for clarity/portability.
grant execute on function public.check_auth_rate_limit(text, text) to service_role;

-- Server-side sanity bounds on client-entered numeric fields. These were
-- previously validated only in the browser, so a direct API/RPC call could
-- write nonsense (negative deal values, absurd ages) straight into the DB.
-- (True 18+ affiliate age verification would need ID checks and can't be
-- enforced by a range constraint — this only rejects obviously bad input.)
alter table public.affiliates add constraint affiliates_age_range_check
  check (age is null or (age between 13 and 120));

alter table public.profiles add constraint profiles_deal_value_nonnegative_check
  check (deal_value is null or deal_value >= 0);

-- The "own profile" UPDATE policy is row-scoped, not column-scoped: it lets
-- a client update ANY column on their own row, including status/deal_value
-- (which only the admin dashboard is meant to set, and which drive affiliate
-- commission payouts). RLS alone can't restrict this to specific columns, so
-- enforce it with a trigger: a non-admin caller's UPDATE keeps its previous
-- status/deal_value/referred_by no matter what values it sends.
create function public.protect_admin_only_profile_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select auth.jwt() ->> 'email') <> 'cervantesmaturinoalexis@gmail.com' then
    new.status := old.status;
    new.deal_value := old.deal_value;
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;

create trigger protect_admin_only_profile_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_admin_only_profile_columns();

revoke execute on function public.protect_admin_only_profile_columns() from public, anon, authenticated;
