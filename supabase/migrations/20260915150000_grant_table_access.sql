-- These tables were created via SQL migration rather than the dashboard, so the
-- default grants Supabase normally applies never ran. RLS policies already
-- restrict which rows each user can touch; these grants just allow table access
-- in the first place, which RLS depends on.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.spec_files to authenticated;

grant select on public.admin_conversations to authenticated;
