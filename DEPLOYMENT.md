# Guía de Despliegue a Producción - AsistenteLegal

Esta guía detalla los pasos necesarios para desplegar AsistenteLegal en un entorno de producción.

## Prerrequisitos
- Node.js v18+
- Cuenta en Supabase con plan adecuado para carga de producción
- Cuenta en OpenAI con suficientes créditos de API
- Dominio personalizado (opcional pero recomendado)
- Plataforma de despliegue: Vercel, AWS, DigitalOcean, etc.

## 1. Preparación del Proyecto para Producción

### 1.1 Optimización del Build
```bash
# Instalar dependencias de producción
npm ci --production

# Ejecutar build optimizado
npm run build
```

### 1.2 Verificación del Build
```bash
# Iniciar servidor de producción localmente
npm run start
```

### 1.3 Ejecución de Pruebas de Integración
```bash
# Ejecutar pruebas de integración
npm run test:integration
```

## 2. Configuración de Base de Datos en Supabase

### 2.1 Configuración del Proyecto
- Asegúrate de usar un proyecto Supabase adecuado para producción.
- Habilita la autenticación apropiada (Email, OAuth, etc.)
- Configura políticas RLS (Row Level Security) para proteger los datos

### 2.2 Extensiones y Configuraciones
- Habilita la extensión `pgvector` para búsquedas semánticas
- Configura backups automáticos
- Configura la extensión `pg_cron` para tareas programadas internas

### 2.3 Despliegue de Edge Functions
```bash
# Asegúrate de tener la CLI de Supabase instalada y configurada
supabase login

# Despliega todas las Edge Functions
supabase functions deploy --project-ref tu-referencia-de-proyecto
```

### 2.4 Configuración de PostgreSQL
- Optimiza índices para tablas grandes
- Configura pooling de conexiones adecuadamente
- Implementa políticas de caché para consultas frecuentes

## 3. Configuración de Almacenamiento

### 3.1 Configuración de Buckets
Configura los siguientes buckets en Supabase Storage:
- `documents` - Para documentos subidos por usuarios
- `gacetas-pdf` - Para almacenar las Gacetas Oficiales
- `fallos-pdf` - Para almacenar los fallos judiciales

### 3.2 Políticas de Acceso
Configura políticas RLS para cada bucket:
```sql
-- Ejemplo para documentos
CREATE POLICY "Documentos accesibles por propietario" 
ON storage.objects FOR SELECT 
USING (auth.uid() = owner_id);
```

## 4. Despliegue en Vercel (recomendado)

### 4.1 Preparación
```bash
# Instalar Vercel CLI
npm install -g vercel
```

### 4.2 Configuración
```bash
# Iniciar sesión y configurar proyecto
vercel login
vercel
```

### 4.3 Configuración de Variables de Entorno
Establece las siguientes variables en el panel de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PERPLEXITY_API_KEY` (**Importante:** Esta es una clave secreta, asegúrate de que Vercel la maneje como tal y **NO** la exponga al cliente).
- `PERPLEXITY_API_BASE_URL` (si la definiste, probablemente `https://api.perplexity.ai`)
- `SUPABASE_SERVICE_KEY` (si la usas, también es secreta).
- Otras variables específicas de producción

### 4.4 Despliegue a Producción
```bash
# Desplegar a producción
vercel --prod
```

## 5. Configuración de Dominio Personalizado

### 5.1 En Vercel
1. Ve a la configuración del proyecto en Vercel
2. Navega a "Domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar los registros DNS

### 5.2 Configuración SSL
Vercel configura automáticamente SSL, pero verifica que:
- El certificado se ha generado correctamente
- La redirección HTTPS está habilitada

## 6. Monitoreo y Análisis

### 6.1 Configuración de Análisis
- Configura Google Analytics o Vercel Analytics
- Implementa logging adecuado en Edge Functions

### 6.2 Monitoreo de Rendimiento
- Configura alertas para tiempos de respuesta
- Implementa monitoreo de uso de recursos
- Configura dashboards para visualizar métricas clave

### 6.3 Seguimiento de Errores
- Considera integrar Sentry para seguimiento de errores en frontend
- Configura logging detallado en Edge Functions

## 7. Escalado y Optimización

### 7.1 Configuración de Caché
- Implementa estrategias de caché para API routes
- Configura cabeceras Cache-Control adecuadas
- Utiliza ISR (Incremental Static Regeneration) donde sea aplicable

### 7.2 Optimización de Base de Datos
- Revisa y optimiza consultas frecuentes
- Implementa índices para búsquedas comunes
- Considera utilizar réplicas de lectura para cargas altas

### 7.3 Escalado de Supabase
Si el tráfico aumenta significativamente:
- Actualiza a un plan superior en Supabase
- Considera implementar sharding para datos de alta frecuencia

## 8. Lista de Verificación Final

- [ ] Pruebas de integración completadas
- [ ] Variables de entorno configuradas
- [ ] Edge Functions desplegadas
- [ ] Políticas RLS configuradas
- [ ] Dominio y SSL configurados
- [ ] Monitoreo implementado
- [ ] Estrategias de caché configuradas
- [ ] Documentación actualizada

## 9. Mantenimiento Continuo

### 9.1 Actualizaciones
Programa actualizaciones regulares para:
- Dependencias de Node.js
- Paquetes NPM
- Next.js
- Supabase

### 9.2 Backups
- Verifica que los backups automáticos de Supabase están funcionando
- Implementa estrategias adicionales de backup si necesario

### 9.3 Seguridad
- Realiza auditorías de seguridad periódicas
- Mantén las dependencias actualizadas
- Revisa regularmente las políticas RLS

## Soporte y Contacto

Para asistencia con el despliegue, contacta al equipo de desarrollo en:
- Email: soporte@asistentelegal.com
- GitHub: Abrir un issue en el repositorio del proyecto 

### Variables de Entorno

Asegúrate de crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
# Clave API de Perplexity AI (requerido - ¡SECRETO! Solo para servidor)
PERPLEXITY_API_KEY=tu_clave_de_perplexity_aqui
# URL Base de la API de Perplexity (requerido - Solo para servidor)
PERPLEXITY_API_BASE_URL=https://api.perplexity.ai

# URL y Clave Anónima de Supabase (obtenidas de tu proyecto Supabase - Públicas)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# (Opcional) Clave de Servicio de Supabase (¡SECRETO! Solo para servidor, si se usa)
# SUPABASE_SERVICE_KEY=tu_supabase_service_key
```

**Nota:** No incluyas `.env.local` en tu control de versiones (ya está en `.gitignore`).

### Despliegue en Vercel (o similar)

1.  **Conectar Repositorio:** Conecta tu repositorio Git (GitHub, GitLab, Bitbucket) a Vercel.
2.  **Configurar Proyecto:**
    *   Framework Preset: `Next.js`
    *   Build Command: `npm run build` (o `yarn build`)
    *   Output Directory: `.next`
    *   Install Command: `npm install` (o `yarn install`)
3.  **Variables de Entorno:** Añade las variables de entorno (`PERPLEXITY_API_KEY`, `PERPLEXITY_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `SUPABASE_SERVICE_KEY` si la usas) en la configuración del proyecto en Vercel. **Asegúrate de que las claves secretas (PERPLEXITY_API_KEY, SUPABASE_SERVICE_KEY) NO estén disponibles en el navegador.** Vercel generalmente maneja esto automáticamente si no usas el prefijo `NEXT_PUBLIC_`.
4.  **Desplegar.**

### Despliegue de Funciones Supabase

Si has modificado o creado funciones Edge de Supabase (en `supabase/functions`), necesitas desplegarlas:

1.  **Instalar Supabase CLI:** Si no la tienes, sigue las instrucciones [aquí](https://supabase.com/docs/guides/cli).
2.  **Iniciar Sesión:** `supabase login`
3.  **Vincular Proyecto:** `supabase link --project-ref TU_ID_DE_PROYECTO` (reemplaza `TU_ID_DE_PROYECTO` con el ID de tu proyecto Supabase).
4.  **Desplegar Funciones:** `supabase functions deploy --project-ref TU_ID_DE_PROYECTO`

**Importante para Funciones:**
*   Asegúrate de que las variables de entorno requeridas por las funciones (como `PERPLEXITY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) estén configuradas en el dashboard de Supabase (Database -> Functions -> tu-funcion -> Secrets).

## Próximos Pasos y Mejoras

*   **Mejorar Extracción de Texto PDF:** Explorar librerías más robustas o servicios externos si `pdfjs-dist` no es suficiente.
*   **Optimizar Búsqueda Semántica:** Ajustar el `match_threshold` y `match_count` en la función `match_documents`.
*   **Interfaz de Usuario:** Añadir paginación, filtros avanzados, visualización de documentos.
*   **Manejo de Errores:** Implementar un manejo de errores más detallado y feedback al usuario.
*   **Seguridad:** Revisar y fortalecer las políticas RLS de Supabase.
*   **Pruebas:** Añadir pruebas unitarias y de integración.
*   **Costos:** Monitorizar el uso de la API de Perplexity y Supabase. 