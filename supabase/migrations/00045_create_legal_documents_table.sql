-- Create a table for legal documents with vector embeddings
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('law', 'jurisprudence', 'doctrine', 'article')),
  reference TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding VECTOR(1536) NOT NULL
);

-- Add an index for efficient similarity search with pgvector
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
  ON public.legal_documents 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Table for tracking when documents were last updated
CREATE TABLE IF NOT EXISTS public.legal_document_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
  document_count INTEGER NOT NULL DEFAULT 0
);

-- Insert initial record for tracking
INSERT INTO public.legal_document_updates (id, last_update, document_count)
VALUES (uuid_generate_v4(), now(), 0)
ON CONFLICT DO NOTHING; 