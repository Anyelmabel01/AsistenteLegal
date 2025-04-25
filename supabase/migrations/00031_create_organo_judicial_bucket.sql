-- Migration: Setup Storage Bucket for Órgano Judicial PDFs

-- 1. Create Storage Bucket for Órgano Judicial PDFs
-- Este bucket almacenará los documentos PDF de fallos judiciales
INSERT INTO storage.buckets (id, name, public)
VALUES ('organo_judicial_pdf', 'organo_judicial_pdf', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- Política para lectura pública (los PDFs de jurisprudencia son públicos)
CREATE POLICY "Allow public access to Órgano Judicial PDFs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'organo_judicial_pdf');

-- Permitir al service role subir documentos
CREATE POLICY "Allow service role to manage Órgano Judicial PDFs" ON storage.objects
  FOR ALL
  USING (bucket_id = 'organo_judicial_pdf' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'organo_judicial_pdf' AND auth.role() = 'service_role'); 