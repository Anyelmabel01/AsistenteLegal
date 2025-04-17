-- Migration: Initial Schema Setup

-- 1. Profiles Table (Linked to auth.users)
-- Stores public user information.
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamptz,
  full_name text,
  avatar_url text
  -- Add other profile fields as needed, e.g., role
);

alter table public.profiles enable row level security;

-- Policy: Allow users to view their own profile.
create policy "Users can view their own profile." on public.profiles
  for select using (auth.uid() = id);

-- Policy: Allow users to update their own profile.
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to automatically create a profile entry when a new user signs up.
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function after a new user is inserted into auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Documents Table
-- Stores metadata about uploaded legal documents.
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  file_name text not null,
  file_path text not null, -- Path in Supabase Storage
  document_type text, -- e.g., 'constitucion', 'codigo_penal', 'jurisprudencia', 'contrato', 'demanda'
  source text, -- e.g., 'Gaceta Oficial', 'Organo Judicial', 'user_upload'
  processed_at timestamptz, -- Timestamp when OCR/embedding finished
  extracted_text text, -- Store extracted text (consider size limits or alternatives)
  status text default 'pending' -- e.g., 'pending', 'processing', 'processed', 'error'
);

alter table public.documents enable row level security;

-- Policy: Allow users to manage (select, insert, update, delete) their own documents.
create policy "Users can manage their own documents" on public.documents
  for all using (auth.uid() = user_id);


-- 3. Document Embeddings Table
-- Stores vector embeddings for document chunks.
create table public.document_embeddings (
  id bigserial primary key,
  document_id uuid references public.documents on delete cascade not null,
  content text, -- The text chunk that was embedded
  embedding vector(1536) -- Assuming OpenAI 'text-embedding-ada-002' model (1536 dimensions)
);

alter table public.document_embeddings enable row level security;

-- Policy: Allow users to access embeddings related to their own documents.
-- (Requires joining with documents table to check ownership)
create policy "Users can select embeddings for their documents" on public.document_embeddings
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- Add an index for efficient similarity search (using HNSW by default with Supabase pgvector)
-- Index creation might take time and resources, done here for completeness.
-- Consider creating index later or adjusting parameters based on data size.
create index on public.document_embeddings using hnsw (embedding vector_l2_ops);
-- Alternative index types: ivfflat (faster builds, potentially less accuracy)
-- create index on public.document_embeddings using ivfflat (embedding vector_l2_ops) with (lists = 100);


-- 4. Cases Table
-- Stores information about legal cases managed by users.
create table public.cases (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  case_name text not null,
  description text,
  status text default 'active' -- e.g., 'active', 'archived', 'closed'
);

alter table public.cases enable row level security;

-- Policy: Allow users to manage their own cases.
create policy "Users can manage their own cases" on public.cases
  for all using (auth.uid() = user_id);


-- 5. Case Documents Table (Junction Table)
-- Links documents to specific cases (Many-to-Many relationship).
create table public.case_documents (
  case_id uuid references public.cases on delete cascade not null,
  document_id uuid references public.documents on delete cascade not null,
  added_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (case_id, document_id) -- Composite primary key
);

alter table public.case_documents enable row level security;

-- Policy: Allow users to link/unlink documents for cases they own.
-- (Requires checking ownership of both the case and the document)
create policy "Users can manage document links for their own cases" on public.case_documents
  for all using (
    exists (
      select 1 from public.cases c
      where c.id = case_id and c.user_id = auth.uid()
    )
    and
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  ); 