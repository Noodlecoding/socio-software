-- Deals closed / commission owed are already computed live from
-- profiles.status and profiles.deal_value via the affiliate_stats view, so
-- no schema change is needed for that part — but the affiliate dashboard
-- needs to know WHEN to refetch that view. Add profiles to the realtime
-- publication so an affiliate's dashboard can subscribe to updates on
-- clients they referred (already RLS-scoped: an affiliate can only ever
-- receive change events for rows they're allowed to select).
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then
  null;
end $$;
