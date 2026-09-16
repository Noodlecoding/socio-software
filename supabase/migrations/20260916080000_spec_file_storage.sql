-- Spec files were never actually uploaded anywhere — the client only ever
-- wrote a metadata row (name/size/type) to public.spec_files, so there was
-- never a real file to download. This adds real storage, with the bucket
-- itself enforcing an allowlist of safe file types and a size cap
-- server-side (not just a client-side <input accept> hint, which is trivial
-- to bypass).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spec-files',
  'spec-files',
  false,
  20971520, -- 20MB
  array[
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/x-yaml',
    'text/yaml',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored at '{user_id}/{filename}', so the first path segment
-- is the owning user's id — same own-row-or-admin pattern as every other
-- table here.
create policy "Users upload own spec files"
  on storage.objects for insert
  with check (
    bucket_id = 'spec-files'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users or admin view spec files"
  on storage.objects for select
  using (
    bucket_id = 'spec-files'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
    )
  );

create policy "Users or admin delete spec files"
  on storage.objects for delete
  using (
    bucket_id = 'spec-files'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
    )
  );

alter table public.spec_files add column storage_path text;
