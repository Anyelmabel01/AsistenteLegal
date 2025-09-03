# 🚀 Asistente Legal de Panamá - Instrucciones de Desarrollo

## 📋 Comandos Disponibles

### 🔥 Comando Principal (RECOMENDADO)
```bash
npm run dev
```
- ✅ **Limpia automáticamente puertos ocupados**
- ✅ **Inicia en puerto 3001** (evita conflictos)
- ✅ **Manejo inteligente de errores**
- ✅ **Cierre limpio con Ctrl+C**

### 🔄 Comandos Alternativos
```bash
# Si quieres usar puerto específico
npm run dev:8000        # Usa puerto 8000 (limpia automáticamente)
npm run dev:simple      # Modo simple sin auto-limpieza

# Para limpiar puertos manualmente
npm run kill-port       # Limpia puertos 8000 y 3001

# Producción
npm run build           # Construye la aplicación
npm run start           # Inicia servidor de producción
```

## 🎯 Solución a Problemas Comunes

### ❌ Error: "address already in use"
**Ya no debería aparecer** con `npm run dev`, pero si aparece:

1. **Opción 1:** Usar el comando de limpieza
   ```bash
   npm run kill-port
   npm run dev
   ```

2. **Opción 2:** Usar puerto alternativo
   ```bash
   npm run dev:simple    # Puerto 3001
   ```

3. **Opción 3:** Limpiar manualmente
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill //PID [NUMERO_PID] //F
   
   # Mac/Linux
   lsof -ti:3001 | xargs kill -9
   ```

## 🌐 Acceso a la Aplicación

- **Desarrollo:** http://localhost:3001
- **Puerto alternativo:** http://localhost:8000 (si usas `npm run dev:8000`)

## 🔧 Características del Nuevo Sistema

- ✅ **Auto-detección de puertos ocupados**
- ✅ **Limpieza automática de procesos**
- ✅ **Múltiples opciones de puerto**
- ✅ **Mensajes informativos claros**
- ✅ **Compatibilidad Windows/Mac/Linux**

## 🆘 Si Aún Tienes Problemas

1. **Reinicia tu terminal** completamente
2. **Verifica que no tengas múltiples terminales** abiertos ejecutando Next.js
3. **Usa el comando de limpieza:** `npm run kill-port`
4. **En último caso, reinicia tu computadora**

---
*¡Ahora ya no tendrás más problemas de puertos ocupados!* 🎉