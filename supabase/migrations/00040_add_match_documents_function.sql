-- Función para realizar búsquedas semánticas en documentos
-- Esta función usa la extensión pgvector para encontrar similitudes entre embeddings
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  file_name text,
  document_type text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.file_name,
    d.document_type,
    e.content,
    1 - (e.embedding <-> query_embedding) as similarity
  from
    public.documents d
    join public.document_embeddings e on d.id = e.document_id
  where
    d.user_id = p_user_id
    and 1 - (e.embedding <-> query_embedding) > match_threshold
  order by
    e.embedding <-> query_embedding
  limit match_count;
$$; 