-- Migration: Setup Supabase Storage for Legal Documents

-- 1. Create Storage Bucket
-- Create a bucket named 'legal_documents' if it doesn't exist.
insert into storage.buckets (id, name, public)
values ('legal_documents', 'legal_documents', false)
on conflict (id) do nothing; -- Do nothing if bucket already exists

-- 2. Storage Policies
-- Policies restrict access based on the authenticated user's ID.
-- Assumes files will be stored under a path like 'user_id/file_name.pdf'

-- Policy: Allow authenticated users to view their own files.
create policy "Allow authenticated users to select own files" on storage.objects
  for select
  using (auth.role() = 'authenticated' and bucket_id = 'legal_documents' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow authenticated users to insert files into their own folder.
create policy "Allow authenticated users to insert into own folder" on storage.objects
  for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'legal_documents' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow authenticated users to update files in their own folder.
create policy "Allow authenticated users to update own files" on storage.objects
  for update
  using (auth.role() = 'authenticated' and bucket_id = 'legal_documents' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- Policy: Allow authenticated users to delete files from their own folder.
create policy "Allow authenticated users to delete own files" on storage.objects
  for delete
  using (auth.role() = 'authenticated' and bucket_id = 'legal_documents' and auth.uid() = (storage.foldername(name))[1]::uuid); 