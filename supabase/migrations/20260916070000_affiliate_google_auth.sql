-- Google OAuth sign-up/sign-in (unlike email/password signUp) doesn't let us
-- attach custom user_metadata, so a Google-based affiliate signup always
-- lands with the safe default account_type='client'. This adds a narrow,
-- server-verified path to claim such an account as 'affiliate' right after
-- the OAuth redirect back — only when the database itself can prove this is
-- a fresh, unused account, not an existing client trying to self-upgrade:
--   * the account_type is still the untouched default 'client'
--   * the auth.users row was created within the last 15 minutes
--   * the account has never sent a message (never touched the Discussion Desk)
--   * the account never completed client onboarding (profiles.country is null)
-- All four checks run server-side against data the client can't fake.
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
    if coalesce(current_setting('app.allow_affiliate_claim', true), 'false') <> 'true' then
      new.account_type := old.account_type;
    end if;
  end if;
  return new;
end;
$$;

create function public.claim_affiliate_account()
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  acct_created timestamptz;
  current_type text;
  has_country boolean;
  has_messages boolean;
begin
  if uid is null then
    return false;
  end if;

  select created_at into acct_created from auth.users where id = uid;
  select account_type, (country is not null) into current_type, has_country
    from public.profiles where id = uid;

  if acct_created is null or current_type is null then
    return false;
  end if;

  if current_type <> 'client' then
    return false;
  end if;

  if now() - acct_created > interval '15 minutes' then
    return false;
  end if;

  if has_country then
    return false;
  end if;

  select exists(select 1 from public.messages where user_id = uid) into has_messages;
  if has_messages then
    return false;
  end if;

  perform set_config('app.allow_affiliate_claim', 'true', true);
  update public.profiles set account_type = 'affiliate' where id = uid;

  return true;
end;
$$;

revoke execute on function public.claim_affiliate_account() from public, anon;
grant execute on function public.claim_affiliate_account() to authenticated;
