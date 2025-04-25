# Asistente Legal

## Descripción
Asistente Legal es una plataforma de IA especializada en derecho panameño que ayuda a profesionales legales a analizar casos, buscar información relevante y obtener recomendaciones basadas en la legislación y jurisprudencia panameña.

## Configuración del Entorno

### Prerrequisitos
- Node.js v18+ 
- npm o yarn
- Cuenta en Supabase
- Cuenta en OpenAI con API key

### Instalación

1. Clonar el repositorio:
```bash
git clone <repositorio>
cd AsistenteLegal
```

2. Instalar dependencias:
```bash
npm install
# o
yarn install
```

3. Configurar variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

# Límites y configuración (opcionales)
NEXT_PUBLIC_MAX_DOCUMENT_SIZE_MB=10
NEXT_PUBLIC_MAX_DOCUMENTS_PER_USER=100
NEXT_PUBLIC_MAX_OPENAI_TOKENS_PER_REQUEST=4000
```

4. Configuración de Supabase:
   - Crea un proyecto en Supabase
   - Ejecuta las migraciones en el directorio `supabase/migrations`
   - Configura el almacenamiento para documentos legales
   - Habilita la extensión pgvector para búsquedas semánticas

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

## Estructura del Proyecto

- `app/`: Páginas principales y rutas de la aplicación (Next.js App Router)
- `components/`: Componentes React reutilizables
- `context/`: Contextos de React, incluyendo autenticación
- `utils/`: Funciones de utilidad y servicios
- `supabase/`: Configuración y migraciones de la base de datos
- `public/`: Archivos estáticos
- `styles/`: Estilos globales (CSS/Tailwind)

## Funcionalidades Principales

- Autenticación de usuarios
- Gestión de documentos legales
- Procesamiento de textos legales
- Búsqueda semántica con vectores
- Sistema de chat asistido por IA
- Análisis de casos y recomendaciones
