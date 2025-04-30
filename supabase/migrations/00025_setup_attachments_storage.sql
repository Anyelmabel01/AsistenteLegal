-- Migration: Setup Supabase Storage for Chat Attachments

-- 1. Create Storage Bucket
-- Create a bucket named 'attachments' if it doesn't exist.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing; -- Do nothing if bucket already exists

-- 2. Storage Policies
-- Policies restrict access based on the authenticated user's ID.
-- Assumes files will be stored under a path like 'user_id/file_name.pdf'

-- Policy: Allow authenticated users to view their own files.
create policy "Allow users to select own attachments" on storage.objects
  for select
  using (auth.role() = 'authenticated' and bucket_id = 'attachments' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow public access to view attachments (since we set 'public' to true)
create policy "Allow public to view attachments" on storage.objects
  for select
  using (bucket_id = 'attachments');

-- Policy: Allow authenticated users to insert files into their own folder.
create policy "Allow users to insert own attachments" on storage.objects
  for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'attachments' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow authenticated users to update files in their own folder.
create policy "Allow users to update own attachments" on storage.objects
  for update
  using (auth.role() = 'authenticated' and bucket_id = 'attachments' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow authenticated users to delete files from their own folder.
create policy "Allow users to delete own attachments" on storage.objects
  for delete
  using (auth.role() = 'authenticated' and bucket_id = 'attachments' and auth.uid() = (storage.foldername(name))[1]::uuid); 