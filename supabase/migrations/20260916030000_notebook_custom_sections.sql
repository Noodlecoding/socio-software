-- The notebook's sections were a fixed, hardcoded set (overview, requirements,
-- budget_timeline, notes). Clients and the admin can now rename/add/delete
-- sections themselves, so "section" becomes a free-form per-user slug instead
-- of a fixed enum, and needs a separate human-readable label plus a sort
-- order for how tabs are displayed.
alter table public.project_notes drop constraint if exists project_notes_section_check;

alter table public.project_notes add column label text;
alter table public.project_notes add column sort_order integer not null default 0;

update public.project_notes set label = 'Overview' where section = 'overview' and label is null;
update public.project_notes set label = 'Requirements' where section = 'requirements' and label is null;
update public.project_notes set label = 'Budget & Timeline' where section = 'budget_timeline' and label is null;
update public.project_notes set label = 'Notes' where section = 'notes' and label is null;
update public.project_notes set label = initcap(replace(section, '_', ' ')) where label is null;

alter table public.project_notes alter column label set not null;

-- delete is now a real operation for this table (removing a custom section)
create policy "Client or admin delete project notes"
  on public.project_notes for delete
  using (
    (select auth.uid()) = user_id
    or (select auth.jwt() ->> 'email') = 'cervantesmaturinoalexis@gmail.com'
  );

grant delete on public.project_notes to authenticated;
