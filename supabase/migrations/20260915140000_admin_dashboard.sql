-- Client pipeline status, set/changed by the admin.
alter table public.profiles
  add column status text not null default 'new_client'
  check (status in ('new_client', 'interested', 'paid'));

-- Tracks whether the admin has seen a given message yet (drives the unread badge).
alter table public.messages
  add column read_by_admin boolean not null default false;

-- The admin account (identified by email) can see and manage every client.
create policy "Admin can view all profiles"
  on public.profiles for select
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can update all profiles"
  on public.profiles for update
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com')
  with check (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can view all messages"
  on public.messages for select
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can insert messages for any client"
  on public.messages for insert
  with check (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can update messages"
  on public.messages for update
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com')
  with check (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can view all spec files"
  on public.spec_files for select
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

-- One row per client conversation: latest message + unread count, for the admin inbox list.
create view public.admin_conversations as
select
  p.id as user_id,
  p.full_name,
  p.organization,
  p.status,
  p.created_at as client_since,
  (
    select count(*) from public.messages m
    where m.user_id = p.id and m.sender = 'user' and m.read_by_admin = false
  ) as unread_count,
  (
    select m.text from public.messages m
    where m.user_id = p.id
    order by m.created_at desc
    limit 1
  ) as last_message,
  (
    select m.created_at from public.messages m
    where m.user_id = p.id
    order by m.created_at desc
    limit 1
  ) as last_message_at
from public.profiles p;

grant select on public.admin_conversations to authenticated;

-- Enable realtime so new messages push to both the client and the admin inbox live.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then
  null;
end $$;
