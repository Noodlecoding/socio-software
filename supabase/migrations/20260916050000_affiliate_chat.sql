-- Every account (client or affiliate) gets a profiles row via handle_new_user,
-- so without this filter an affiliate's own chat messages would also leak
-- into the client inbox below (admin_conversations joins on all of
-- public.profiles, with no account_type filter). Scope it to clients only —
-- affiliate conversations now live in admin_affiliate_conversations instead.
create or replace view public.admin_conversations as
select
  p.id as user_id,
  p.full_name,
  p.organization,
  p.status,
  p.created_at as client_since,
  p.referred_by,
  aff.email as affiliate_email,
  aff.full_name as affiliate_name,
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
from public.profiles p
left join public.affiliates aff on aff.referral_code = p.referred_by
where p.account_type = 'client';

alter view public.admin_conversations set (security_invoker = true);

grant select on public.admin_conversations to authenticated;

-- Affiliates can now message the admin directly from their dashboard, using
-- the same public.messages table clients already use (it's keyed by
-- user_id, which works for any auth.users row regardless of account_type,
-- and RLS already allows "own messages or admin views/replies to all").
-- This view surfaces affiliate conversations for the admin inbox, the same
-- way admin_conversations does for clients.
create view public.admin_affiliate_conversations as
select
  a.id as affiliate_id,
  a.full_name,
  a.email,
  a.referral_code,
  a.created_at as affiliate_since,
  (
    select count(*) from public.messages m
    where m.user_id = a.id and m.sender = 'user' and m.read_by_admin = false
  ) as unread_count,
  (
    select m.text from public.messages m
    where m.user_id = a.id
    order by m.created_at desc
    limit 1
  ) as last_message,
  (
    select m.created_at from public.messages m
    where m.user_id = a.id
    order by m.created_at desc
    limit 1
  ) as last_message_at
from public.affiliates a;

alter view public.admin_affiliate_conversations set (security_invoker = true);

grant select on public.admin_affiliate_conversations to authenticated;
