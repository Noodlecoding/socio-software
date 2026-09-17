-- profiles.deal_value now represents the agreed deal cost (total contract
-- value, set directly by admin — still what affiliate commission is
-- calculated from). Amount actually collected so far is tracked separately,
-- via the same additive "Contribute" pattern as affiliate payouts.
alter table public.profiles add column amount_paid numeric not null default 0 check (amount_paid >= 0);

-- amount_paid is admin-only, same as status/deal_value/referred_by/account_type.
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
    new.amount_paid := old.amount_paid;
  end if;
  return new;
end;
$$;
