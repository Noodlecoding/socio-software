-- A client and an affiliate must be separate accounts — someone shouldn't be
-- able to sign up as a client and later also register that same account as
-- an affiliate (or vice versa). Track which kind of account this is, set
-- once at signup time from the metadata each signup flow passes in.
alter table public.profiles add column account_type text not null default 'client'
  check (account_type in ('client', 'affiliate'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, organization, selected_model, referred_by, account_type)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'organization',
    coalesce(new.raw_user_meta_data->>'selected_model', 'core-workflow'),
    new.raw_user_meta_data->>'referred_by',
    coalesce(new.raw_user_meta_data->>'account_type', 'client')
  );
  return new;
end;
$$;

-- account_type is decided once at signup and must never be changeable by the
-- account owner afterward (otherwise a client could just flip their own
-- account_type to 'affiliate' via a direct API call and bypass the whole
-- point of this separation) — extend the existing admin-only-columns guard.
create or replace function public.protect_admin_only_profile_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select auth.jwt() ->> 'email') <> 'cervantesmaturinoalexis@gmail.com' then
    new.status := old.status;
    new.deal_value := old.deal_value;
    new.referred_by := old.referred_by;
    new.account_type := old.account_type;
  end if;
  return new;
end;
$$;

-- The UI gates "Become an Affiliate" behind account_type, but that's only
-- enforced client-side unless the database itself checks it too — otherwise
-- a client could call the affiliates insert directly and bypass the gate
-- entirely. Require the profile to already be tagged 'affiliate' (set once,
-- at signup, and immutable after — see the trigger above) before a row can
-- be created here.
drop policy if exists "Affiliate can insert own row" on public.affiliates;

create policy "Affiliate can insert own row"
  on public.affiliates for insert
  with check (
    (select auth.uid()) = id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.account_type = 'affiliate'
    )
  );
