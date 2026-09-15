-- Profiles: one row per authenticated user, populated automatically on signup.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  organization text,
  selected_model text not null default 'core-workflow',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created,
-- pulling name/organization/selected model out of the signup metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, organization, selected_model)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'organization',
    coalesce(new.raw_user_meta_data->>'selected_model', 'core-workflow')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Discussion Desk chat messages, scoped per user.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('architect', 'user', 'system')),
  sender_name text not null,
  sender_title text,
  sender_initials text,
  text text not null,
  attachments jsonb,
  is_preliminary_plan boolean not null default false,
  architect_review_notice boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users manage own messages"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index messages_user_id_created_at_idx on public.messages (user_id, created_at);

-- Uploaded spec files, scoped per user.
create table public.spec_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  size text,
  type text,
  created_at timestamptz not null default now()
);

alter table public.spec_files enable row level security;

create policy "Users manage own spec files"
  on public.spec_files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index spec_files_user_id_created_at_idx on public.spec_files (user_id, created_at);
