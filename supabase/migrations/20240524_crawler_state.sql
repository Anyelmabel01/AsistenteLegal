-- Tabla para almacenar el estado de los crawlers
CREATE TABLE IF NOT EXISTS public.crawler_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL UNIQUE,
  content_selector TEXT,
  last_content_hash TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  update_detected_at TIMESTAMP WITH TIME ZONE,
  last_change_content_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por URL
CREATE INDEX idx_crawler_state_url ON public.crawler_state(source_url);

-- Habilitar RLS
ALTER TABLE public.crawler_state ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden modificar esta tabla
CREATE POLICY "Anyone can read crawler state" 
ON public.crawler_state FOR SELECT USING (true);

CREATE POLICY "Only admins can modify crawler state" 
ON public.crawler_state FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
); 