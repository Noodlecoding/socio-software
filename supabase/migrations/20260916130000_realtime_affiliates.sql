-- click_count (and paid_out) can change without the affiliate doing
-- anything themselves — a visitor clicking their link, or the admin marking
-- a payout — so their dashboard needs to know when to refetch. Same gap as
-- profiles had earlier: add affiliates to the realtime publication.
do $$
begin
  alter publication supabase_realtime add table public.affiliates;
exception when duplicate_object then
  null;
end $$;
