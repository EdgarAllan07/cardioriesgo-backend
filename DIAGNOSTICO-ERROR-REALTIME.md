# 🔴 Error al Generar Reporte - Diagnóstico

## Error Encontrado

```
ConnectorError: function realtime.broadcast_changes(text, text, name, name, alertas, alertas) does not exist
```

## Causa del Problema

El error ocurre cuando se intenta crear un registro en la tabla `resultado_ia`. El problema NO está en tu código backend, sino en la **configuración de la base de datos de Supabase**.

### ¿Por qué sucede?

Supabase tiene un sistema de "Realtime" que permite suscribirse a cambios en las tablas. Este sistema usa **triggers de PostgreSQL** que se ejecutan automáticamente cuando se insertan, actualizan o eliminan registros.

El error indica que existe un trigger configurado que intenta llamar a una función `realtime.broadcast_changes()` con una firma incorrecta o que la función no existe en tu versión de Supabase.

## Soluciones Posibles

### Opción 1: Desactivar Realtime para las Tablas Problemáticas (Recomendado)

Si no estás usando la funcionalidad de Realtime de Supabase, puedes desactivarla:

1. Ve al Dashboard de Supabase
2. Navega a **Database** → **Replication**
3. Busca las tablas: `resultado_ia`, `alertas`, `evaluacion_clinica`
4. Desactiva la replicación/realtime para estas tablas

### Opción 2: Actualizar la Función de Realtime

Si necesitas Realtime, el problema puede ser que la función tiene una firma antigua. Ejecuta este SQL en Supabase:

```sql
-- Verificar si la función existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'broadcast_changes'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'realtime');

-- Si no existe o tiene problemas, puedes intentar recrearla
-- (Esto requiere permisos de superusuario en Supabase)
```

### Opción 3: Eliminar los Triggers Manualmente

Puedes eliminar los triggers problemáticos ejecutando:

```sql
-- Ver todos los triggers en la tabla alertas
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.alertas'::regclass;

-- Eliminar el trigger problemático (reemplaza 'nombre_del_trigger' con el nombre real)
DROP TRIGGER IF EXISTS nombre_del_trigger ON public.alertas;
```

### Opción 4: Usar una Conexión Directa (Temporal)

Si estás usando la URL de conexión con pooling, intenta usar la URL directa:

En tu `.env`, cambia:

```env
# De esto (con pooling):
DATABASE_URL="postgresql://..."

# A esto (conexión directa):
DIRECT_URL="postgresql://..."
```

Y en `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DIRECT_URL")  // Cambiar temporalmente
}
```

## Verificación del Problema

Para confirmar que este es el problema, ejecuta en Supabase SQL Editor:

```sql
-- Ver los triggers en la tabla resultado_ia
SELECT
    t.tgname AS trigger_name,
    t.tgrelid::regclass AS table_name,
    p.proname AS function_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid IN (
    'public.resultado_ia'::regclass,
    'public.alertas'::regclass,
    'public.evaluacion_clinica'::regclass
)
AND NOT t.tgisinternal;
```

## Próximos Pasos

1. **Identifica** qué solución prefieres (recomiendo Opción 1 si no usas Realtime)
2. **Aplica** la solución en el Dashboard de Supabase
3. **Prueba** nuevamente el endpoint `/api/reportes/generar`

## Nota Importante

⚠️ **Tu código backend está correcto**. Este es un problema de configuración de la base de datos de Supabase, no un bug en tu aplicación.

---

## Estado Actual del Endpoint

✅ El endpoint `/api/reportes/generar` está correctamente implementado  
✅ La lógica de negocio funciona correctamente  
✅ El problema es SOLO la configuración de triggers en Supabase  
❌ Necesitas aplicar una de las soluciones anteriores en Supabase
