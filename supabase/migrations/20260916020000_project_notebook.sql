-- Shared project notebook: a per-client set of notes sections that both the
-- client and the admin can read and edit. Each section is its own row (not
-- one big blob) so the client editing "Budget" and the admin editing
-- "Requirements" at the same time never touches the same row — that's what
-- keeps concurrent edits from clobbering each other at the row level. The
-- app additionally avoids overwriting whichever section a user currently has
-- open and unsaved when a realtime update comes in for it.
create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('overview', 'requirements', 'budget_timeline', 'notes')),
  content text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (user_id, section)
);

alter table public.project_notes enable row level security;

create policy "Client or admin view project notes"
  on public.project_notes for select
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Client or admin insert project notes"
  on public.project_notes for insert
  with check (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Client or admin update project notes"
  on public.project_notes for update
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  )
  with check (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

grant select, insert, update on public.project_notes to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.project_notes;
exception when duplicate_object then
  null;
end $$;
