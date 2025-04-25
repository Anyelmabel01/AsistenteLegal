-- Tabla para fuentes legales
CREATE TABLE IF NOT EXISTS public.legal_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  url VARCHAR(255),
  crawler_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir fuentes iniciales
INSERT INTO public.legal_sources (name, description, url, crawler_enabled)
VALUES 
  ('Gaceta Oficial', 'Publicación oficial del Gobierno de Panamá', 'https://www.gacetaoficial.gob.pa/', true),
  ('Organo Judicial', 'Órgano Judicial de la República de Panamá', 'https://www.organojudicial.gob.pa/', true);

-- Tabla para actualizaciones legales
CREATE TABLE IF NOT EXISTS public.legal_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(255) NOT NULL REFERENCES public.legal_sources(name),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  url VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_type VARCHAR(50),
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por source y fecha
CREATE INDEX idx_legal_updates_source_date ON public.legal_updates(source, published_at);

-- Tabla para suscripciones de usuarios
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source VARCHAR(255) NOT NULL REFERENCES public.legal_sources(name),
  active BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'immediately',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, source)
);

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Tabla para notificaciones de usuarios
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  source VARCHAR(255),
  link VARCHAR(255),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por user_id y estado de lectura
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(user_id, read);

-- Función para procesar actualizaciones y crear notificaciones
CREATE OR REPLACE FUNCTION process_legal_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear notificaciones para usuarios suscritos a esta fuente
  INSERT INTO public.user_notifications (user_id, title, message, source, link)
  SELECT 
    us.user_id,
    NEW.title,
    SUBSTRING(NEW.description FROM 1 FOR 250) || '...',
    NEW.source,
    NEW.url
  FROM public.user_subscriptions us
  WHERE us.source = NEW.source
  AND us.active = true
  AND (us.frequency = 'immediately' OR (EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 18 AND us.frequency = 'daily'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para procesar actualizaciones automáticamente
DROP TRIGGER IF EXISTS trigger_legal_update ON public.legal_updates;
CREATE TRIGGER trigger_legal_update
AFTER INSERT ON public.legal_updates
FOR EACH ROW
EXECUTE FUNCTION process_legal_update();

-- RLS (Row Level Security)
-- Enable RLS on all tables
ALTER TABLE public.legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Legal sources: cualquiera puede leer, solo admin puede escribir
CREATE POLICY "Anyone can read legal sources" 
ON public.legal_sources FOR SELECT USING (true);

CREATE POLICY "Only admins can modify legal sources" 
ON public.legal_sources FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Legal updates: cualquiera puede leer, solo el sistema/admin puede escribir
CREATE POLICY "Anyone can read legal updates" 
ON public.legal_updates FOR SELECT USING (true);

CREATE POLICY "Only admins can modify legal updates" 
ON public.legal_updates FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- User subscriptions: usuarios solo pueden ver y modificar sus propias suscripciones
CREATE POLICY "Users can manage their own subscriptions" 
ON public.user_subscriptions 
FOR ALL USING (auth.uid() = user_id);

-- Notifications: usuarios solo pueden ver y modificar sus propias notificaciones
CREATE POLICY "Users can manage their own notifications" 
ON public.user_notifications 
FOR ALL USING (auth.uid() = user_id); 