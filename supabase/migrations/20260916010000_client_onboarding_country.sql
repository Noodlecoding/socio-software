-- Clients now provide their name/country/company after account creation (in
-- an onboarding step) rather than on the signup form itself, so add a
-- country column to capture it. Existing rows default to null, which the
-- app treats as "hasn't completed onboarding yet."
alter table public.profiles add column country text;
