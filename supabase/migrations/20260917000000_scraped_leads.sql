-- Outbound prospects collected by the local scraper (scraper/). Only the admin
-- account can read or edit them; the scraper writes with the service-role key,
-- which bypasses RLS.
create table public.scraped_leads (
  id uuid primary key default gen_random_uuid(),
  cqc_location_id text unique,
  name text not null,
  website text,
  phone text,
  email text,
  address text,
  postcode text,
  city text,
  owner_name text,
  company_number text,
  company_type text not null default 'unknown'
    check (company_type in ('ltd', 'partnership_or_sole_trader', 'unknown')),
  can_cold_email boolean not null default false,
  team_size integer,
  sites_count integer,
  signals text[] not null default '{}',
  score integer not null default 0,
  opener text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'replied', 'won', 'not_interested')),
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index scraped_leads_score_idx on public.scraped_leads (score desc);
create index scraped_leads_status_idx on public.scraped_leads (status);

alter table public.scraped_leads enable row level security;

create policy "Admin can view scraped leads"
  on public.scraped_leads for select
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can update scraped leads"
  on public.scraped_leads for update
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com')
  with check (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

create policy "Admin can delete scraped leads"
  on public.scraped_leads for delete
  using (auth.jwt() ->> 'email' = 'cervantesmaturinoalexis@gmail.com');

grant select, update, delete on public.scraped_leads to authenticated;
