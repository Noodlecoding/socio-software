-- Bug: the affiliates INSERT policy's WITH CHECK queries public.profiles to
-- verify account_type='affiliate', but the profiles SELECT policy also
-- queries public.affiliates (to let an affiliate see clients they referred).
-- That's a circular RLS dependency — Postgres detects it and throws
-- "infinite recursion detected in policy for relation affiliates" on every
-- attempt to become an affiliate, which is why "Become an Affiliate" was
-- failing with a generic error for every user.
--
-- Fix: read account_type through a SECURITY DEFINER function instead of a
-- plain subquery. Security definer functions run as their owner (which owns
-- these tables and therefore bypasses RLS on them), so this reads
-- account_type directly without re-triggering profiles' RLS policy at all —
-- breaking the cycle.
create function public.get_account_type(target_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select account_type from public.profiles where id = target_id;
$$;

revoke execute on function public.get_account_type(uuid) from public;
grant execute on function public.get_account_type(uuid) to authenticated;

drop policy if exists "Affiliate can insert own row" on public.affiliates;

create policy "Affiliate can insert own row"
  on public.affiliates for insert
  with check (
    (select auth.uid()) = id
    and public.get_account_type((select auth.uid())) = 'affiliate'
  );
