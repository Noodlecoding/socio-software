import { supabase } from './supabaseClient';

export type AuthAction = 'signup' | 'signin' | 'password_reset';

export const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait 10 minutes and try again.';

// Server-enforced: max 5 signup/login attempts per email within a rolling
// 10-minute window (see public.check_auth_rate_limit). Call before every
// signUp/signInWithPassword call so it can't be bypassed by clearing local
// storage or reloading the page.
export async function checkAuthRateLimit(email: string, action: AuthAction): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_auth_rate_limit', {
    p_identifier: email,
    p_action: action
  });
  if (error) {
    console.error('Rate limit check failed:', error.message);
    return true;
  }
  return data === true;
}
