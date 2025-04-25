-- Función para realizar búsquedas semánticas en documentos legales
-- Esta función usa la extensión pgvector para encontrar similitudes entre embeddings
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  type text,
  reference text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.title,
    d.content,
    d.type,
    d.reference,
    d.source,
    1 - (d.embedding <-> query_embedding) as similarity
  from
    public.legal_documents d
  where
    1 - (d.embedding <-> query_embedding) > match_threshold
  order by
    d.embedding <-> query_embedding
  limit match_count;
$$; 