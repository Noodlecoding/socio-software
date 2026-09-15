-- CRITICAL FIX: this view was created by a superuser (via CLI push), which by
-- default makes it bypass Row Level Security entirely for anyone who queries
-- it — any signed-in client could see every other client's data. Forcing
-- security_invoker makes it respect the querying user's own RLS instead.
alter view public.admin_conversations set (security_invoker = true);

-- Consolidate the separate "own row" and "admin" policies into one policy per
-- command, and wrap auth.uid()/auth.jwt() in a subselect so Postgres evaluates
-- them once per query instead of once per row (Supabase lint: multiple
-- permissive policies / auth RLS initialization plan).

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Admin can update all profiles" on public.profiles;

create policy "View own profile or admin views all"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Update own profile or admin updates all"
  on public.profiles for update
  using (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  )
  with check (
    (select auth.uid()) = id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Insert own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

-- messages
drop policy if exists "Users manage own messages" on public.messages;
drop policy if exists "Admin can view all messages" on public.messages;
drop policy if exists "Admin can insert messages for any client" on public.messages;
drop policy if exists "Admin can update messages" on public.messages;

create policy "View own messages or admin views all"
  on public.messages for select
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Insert own messages or admin replies to any client"
  on public.messages for insert
  with check (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Update own messages or admin updates any"
  on public.messages for update
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  )
  with check (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Delete own messages"
  on public.messages for delete
  using ((select auth.uid()) = user_id);

-- spec_files
drop policy if exists "Users manage own spec files" on public.spec_files;
drop policy if exists "Admin can view all spec files" on public.spec_files;

create policy "View own spec files or admin views all"
  on public.spec_files for select
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

create policy "Insert own spec files"
  on public.spec_files for insert
  with check ((select auth.uid()) = user_id);

create policy "Update own spec files"
  on public.spec_files for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete own spec files"
  on public.spec_files for delete
  using ((select auth.uid()) = user_id);
