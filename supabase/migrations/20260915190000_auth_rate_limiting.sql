-- Rate-limit account creation and login attempts: max 5 attempts per
-- email + action within a rolling 10-minute window. Enforced server-side
-- (not just client-side) so it can't be bypassed by clearing local storage.
create table public.auth_attempts (
  id bigint generated always as identity primary key,
  identifier text not null,
  action text not null check (action in ('signup', 'signin')),
  attempted_at timestamptz not null default now()
);

create index auth_attempts_identifier_action_time_idx
  on public.auth_attempts (identifier, action, attempted_at);

-- No RLS policies: this table is only ever touched through the security
-- definer function below, which runs as the table owner.
alter table public.auth_attempts enable row level security;

-- Records this attempt and returns whether it's allowed. Call this BEFORE
-- attempting the actual signUp/signInWithPassword call; if it returns
-- false, block the request client-side instead of hitting Auth.
create function public.check_auth_rate_limit(p_identifier text, p_action text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.auth_attempts
  where identifier = lower(trim(p_identifier))
    and action = p_action
    and attempted_at > now() - interval '10 minutes';

  if recent_count >= 5 then
    return false;
  end if;

  insert into public.auth_attempts (identifier, action)
  values (lower(trim(p_identifier)), p_action);

  return true;
end;
$$;

grant execute on function public.check_auth_rate_limit(text, text) to anon, authenticated;
