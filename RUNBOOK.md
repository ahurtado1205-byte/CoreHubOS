# HotelFlow — Runbook Operacional

## Requisitos del Sistema

| Requisito | Versión | Notas |
|---|---|---|
| Node.js | ≥ 20.x | Recomendado: 20 LTS |
| npm | ≥ 10.x | Incluido con Node |
| Git | cualquier | Para versionado |
| Cuenta Supabase | - | Gratis en supabase.com |
| Cuenta Vercel | - | Gratis en vercel.com |

---

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/hotel-flow.git
cd hotel-flow

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Ejecutar en desarrollo
npm run dev
# → Disponible en http://localhost:3000
```

---

## Variables de Entorno

### Variables Requeridas en Producción

| Variable | Dónde | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (Production + Preview) | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (Production + Preview) | Clave anon pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (Production) | Clave secreta server-side |

### Configurar en Vercel

```bash
# Via CLI
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# También agregar para Preview:
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Verificar variables configuradas:
npx vercel env ls
```

---

## Base de Datos Supabase

### Schema Requerido

Ejecutar en el SQL Editor de Supabase:

```sql
-- Tabla principal de estado del sistema
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de miembros del equipo (para autorización)
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  property_id TEXT,
  role_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estado inicial (necesario para primer uso)
INSERT INTO system_state (key, data)
VALUES ('global', '{"version": 0}')
ON CONFLICT (key) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- system_state: solo service role puede leer/escribir
-- (La app lo accede exclusivamente via API route con service role key)
CREATE POLICY "service_role_only" ON system_state
  FOR ALL USING (auth.role() = 'service_role');

-- team_members: solo service role
CREATE POLICY "service_role_only" ON team_members
  FOR ALL USING (auth.role() = 'service_role');
```

### Migración: Agregar usuario admin inicial

```sql
-- Crear primer miembro del equipo admin
-- Reemplazar con el email del administrador real
INSERT INTO team_members (id, first_name, last_name, email, role_id, status)
VALUES ('usr_admin_1', 'Admin', 'Principal', 'admin@tuhotel.com', 'role_admin', 'active')
ON CONFLICT (email) DO NOTHING;
```

---

## Comandos de Desarrollo

```bash
# Servidor de desarrollo (con hot reload)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build de producción local
npm run build
npm run start

# Deploy a Vercel (preview)
npx vercel

# Deploy a producción
npx vercel --prod
```

---

## Estructura de la Base de Datos Local (Desarrollo)

El archivo `local_db.json` en el root actúa como base de datos en desarrollo cuando no hay Supabase configurado.

```bash
# Verificar el estado de la base local
node check-db.js

# Reset completo (borra todos los datos)
echo '{}' > local_db.json
```

> ⚠️ **Nunca commitear `local_db.json` con datos reales de clientes.**

---

## Diagnóstico de Errores Comunes

### Error: "Failed to fetch" en login

**Causa:** Las variables de entorno de Supabase no están configuradas en Vercel para el ambiente `preview`.

**Solución:**
```bash
npx vercel env ls
# Verificar que NEXT_PUBLIC_SUPABASE_ANON_KEY existe en Preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

---

### Error: 403 Forbidden al guardar datos

**Causa:** El usuario está autenticado en Supabase pero no existe en la tabla `team_members`.

**Solución:**
```sql
INSERT INTO team_members (id, first_name, last_name, email, role_id, status)
VALUES (gen_random_uuid(), 'Nombre', 'Apellido', 'email@ejemplo.com', 'role_admin', 'active');
```

---

### Error: 409 Conflict al guardar

**Causa:** Dos dispositivos guardaron simultáneamente y hay conflicto de versión.

**Solución:** Recargar la página (`F5`). Los datos de la base de datos tomarán precedencia.

---

### Error: Pantalla en blanco al editar reserva

**Causa:** `parseISO()` o la función de cálculo de precios crashea con fechas vacías o en formato incorrecto.

**Solución:** Verificar que las fechas `check_in` y `check_out` tengan formato `YYYY-MM-DD`.

---

### Error: Build falla con "Module not found"

**Causa:** Import a un archivo que no existe o fue renombrado.

**Solución:**
```bash
npm run typecheck
# Los errores de imports aparecerán con el archivo y línea exacta
```

---

### Night Audit redirige a 404

**Causa (anterior):** El redirect en `next.config.ts` apuntaba a `/operations/night-audit` que no existe.

**Estado:** ✅ Corregido. `/night-audit` sirve su propia página directamente.

---

## Proceso de Deploy

```bash
# 1. Verificar que TypeScript esté limpio
npm run typecheck

# 2. Build local para verificar
npm run build

# 3. Deploy a producción
npx vercel --prod

# 4. Verificar el deploy
npx vercel inspect <deployment-url>

# URL permanente de producción:
# https://hotel-flow-iota.vercel.app
```

---

## Monitoreo

- **Logs Vercel:** https://vercel.com/agustins-projects-bd77a3d2/hotel-flow
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xbehxdovbasgajxdnzqs
- **Estado de autenticación:** Supabase → Authentication → Users

---

## Contacto

- **Proyecto:** HotelFlow / CoreHub OS
- **Propietario:** Agustín Hurtado (ahurtado1205@gmail.com)
