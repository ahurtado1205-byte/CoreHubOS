-- ============================================================
-- HotelFlow — RLS para system_state
-- Bloque 2: Aislamiento de estado por usuario autenticado
-- ============================================================
-- 
-- CONTEXTO:
-- La tabla system_state almacena el estado completo de la app
-- en un único registro JSONB con key='global'.
-- La arquitectura actual es single-tenant por sesión de Supabase.
-- Esta migración aplica RLS básica para que:
--   1. Solo usuarios autenticados (vía service role o token) puedan leer/escribir.
--   2. Usuarios anónimos no puedan acceder directamente.
--
-- NOTA IMPORTANTE:
-- La API /api/db usa el SERVICE ROLE KEY (bypass de RLS) para
-- sus operaciones. Por lo tanto estas políticas aplican a clientes
-- que intenten acceder directamente a Supabase sin pasar por la API.
-- Esto es una capa adicional de defensa en profundidad.
--
-- Para una arquitectura multi-tenant real (múltiples hoteles),
-- se requerirá normalizar system_state a tablas por property_id,
-- y agregar políticas basadas en membresías. Ver RUNBOOK.md.
-- ============================================================

-- Crear la tabla system_state si no existe (por si se ejecuta en un proyecto nuevo)
CREATE TABLE IF NOT EXISTS public.system_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen (para re-aplicar de forma segura)
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.system_state;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.system_state;
DROP POLICY IF EXISTS "Allow authenticated write" ON public.system_state;
DROP POLICY IF EXISTS "Allow service role full access" ON public.system_state;

-- Política 1: El service role (usado por /api/db server-side) tiene acceso total.
-- USING (true) con rol específico permite que las API routes operen normalmente.
CREATE POLICY "Allow service role full access"
  ON public.system_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política 2: Usuarios autenticados pueden leer el estado de la app.
-- En la arquitectura actual hay un único registro global, pero esto
-- previene que usuarios anónimos lean datos directamente desde Supabase SDK.
CREATE POLICY "Allow authenticated read"
  ON public.system_state
  FOR SELECT
  TO authenticated
  USING (true);

-- Política 3: Usuarios autenticados pueden modificar el estado (vía /api/db proxy).
-- En producción, toda escritura debe pasar por /api/db que valida auth + ownership.
-- Esta política es la capa de defensa si alguien intentara escribir directamente.
CREATE POLICY "Allow authenticated write"
  ON public.system_state
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTA: Los usuarios anónimos (anon role) no tienen política → acceso denegado por default.
-- La API /api/db maneja el caso del motor de reservas (guest booking) usando service_role.
