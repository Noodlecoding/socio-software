// Auto-confirms a freshly-signed-up affiliate's email so they can sign in
// immediately, skipping the "check your inbox" confirmation link. Client
// signups are unaffected — this is only ever called from the affiliate
// onboarding flow, right after signUp and before any session exists (that's
// the whole reason it needs a service-role key: the anon key can't confirm
// emails, and there's no user session yet to authenticate the call with).
//
// Since there's no session to check, the caller is verified by requiring
// BOTH the exact userId AND the exact email on file for that account —
// something only someone who just completed that signUp (or received its
// response) would know. This is also rate-limited per email so it can't be
// used to brute-force/probe accounts.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  let userId: string | undefined;
  let email: string | undefined;
  try {
    const body = await req.json();
    userId = body?.userId;
    email = body?.email;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!userId || typeof userId !== 'string' || !email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: allowed, error: rateLimitError } = await admin.rpc('check_auth_rate_limit', {
    p_identifier: email,
    p_action: 'confirm_email'
  });
  if (!rateLimitError && allowed === false) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Please wait and try again.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: userResult, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !userResult?.user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (userResult.user.email?.toLowerCase() !== email.toLowerCase()) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!userResult.user.email_confirmed_at) {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
