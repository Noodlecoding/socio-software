-- Forgot-password code requests get their own rate-limit bucket, same
-- pattern as signup/signin/confirm_email.
alter table public.auth_attempts drop constraint auth_attempts_action_check;
alter table public.auth_attempts add constraint auth_attempts_action_check
  check (action in ('signup', 'signin', 'confirm_email', 'password_reset'));
