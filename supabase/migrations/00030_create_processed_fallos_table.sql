-- Migration: Create processed_fallos table for Órgano Judicial scraper
-- Esta tabla almacena los fallos/jurisprudencias ya procesados del Órgano Judicial

-- Crear tabla para fallos procesados
CREATE TABLE IF NOT EXISTS public.processed_fallos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  url text UNIQUE NOT NULL,
  title text NOT NULL,
  tribunal text,
  fallo_date text,
  descripcion text
);

-- Comentarios para documentación
COMMENT ON TABLE public.processed_fallos IS 'Registro de fallos judiciales procesados del Órgano Judicial';
COMMENT ON COLUMN public.processed_fallos.url IS 'URL del documento, usado como clave única para evitar duplicados';
COMMENT ON COLUMN public.processed_fallos.title IS 'Título del fallo o jurisprudencia';
COMMENT ON COLUMN public.processed_fallos.tribunal IS 'Tribunal que emitió el fallo';
COMMENT ON COLUMN public.processed_fallos.fallo_date IS 'Fecha del fallo en formato de texto';
COMMENT ON COLUMN public.processed_fallos.descripcion IS 'Descripción o resumen del fallo si está disponible';

-- Permisos: Solo permite lectura al rol de autenticado y acceso completo vía service_role
ALTER TABLE public.processed_fallos ENABLE ROW LEVEL SECURITY;

-- Política: Solo permiten leer a usuarios autenticados (útil para debugging/reporting)
CREATE POLICY "Allow authenticated read access" ON public.processed_fallos
  FOR SELECT
  TO authenticated
  USING (true); 