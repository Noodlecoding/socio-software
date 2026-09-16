// Auto-confirms a freshly-signed-up affiliate's email so they can sign in
// immediately, skipping the "check your inbox" confirmation link. Client
// signups are unaffected — this is only ever called from the affiliate
// onboarding flow. Uses the service-role key (never exposed to the browser)
// to call the Auth admin API, since the anon key cannot confirm emails.
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let userId: string | undefined;
  try {
    const body = await req.json();
    userId = body?.userId;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!userId || typeof userId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: userResult, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !userResult?.user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  if (!userResult.user.email_confirmed_at) {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
