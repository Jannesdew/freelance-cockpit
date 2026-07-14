insert into storage.buckets (id, name, public)
values ('project-covers', 'project-covers', true)
on conflict (id) do nothing;

-- Path convention: {user_id}/{project_id}-{random}.{ext} — the first path
-- segment is the owning user's id, so foldername(name)[1] scopes access.
create policy "project_covers_select_own" on storage.objects
  for select using (
    bucket_id = 'project-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_covers_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'project-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_covers_update_own" on storage.objects
  for update using (
    bucket_id = 'project-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_covers_delete_own" on storage.objects
  for delete using (
    bucket_id = 'project-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
