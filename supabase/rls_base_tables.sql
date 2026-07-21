-- ============================================================
-- HotelFlow — RLS mejorada para tablas base (properties, team_members, etc.)
-- Bloque 2: Reemplaza "Enable all access for MVP" por políticas reales
-- ============================================================
--
-- ANTES (schema.sql):
--   CREATE POLICY "Enable all access for MVP" ON properties FOR ALL USING (true);
--   → Cualquier usuario autenticado podía leer/escribir TODAS las propiedades.
--
-- DESPUÉS (este script):
--   - properties: solo usuarios con membresía en esa propiedad
--   - team_members: solo el propio registro o service role
--   - units / unit_types: solo usuarios miembros de la propiedad
--   - bookings: solo usuarios miembros de la propiedad
--   - roles: solo usuarios autenticados (solo lectura)
--
-- PREREQUISITO: La tabla team_members debe tener la columna property_id.
-- PREREQUISITO: El usuario autenticado debe tener su email en team_members.
--
-- ADVERTENCIA: Este script elimina las políticas "Enable all access for MVP".
-- Ejecutar SOLO si team_members está correctamente poblada con los usuarios.
-- Si hay dudas, primero verificar con: SELECT * FROM team_members WHERE email = 'tu@email.com';
-- ============================================================

-- ── Función auxiliar ───────────────────────────────────────────────────────
-- Retorna los property_ids a los que tiene acceso el usuario autenticado actual.
-- Se usa en las políticas de RLS para filtrar por propiedad.
CREATE OR REPLACE FUNCTION public.get_user_property_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(property_id)
  FROM public.team_members
  WHERE email = auth.jwt() ->> 'email'
    AND status = 'active'
    AND property_id IS NOT NULL;
$$;

-- ── properties ────────────────────────────────────────────────────────────
-- Eliminar política MVP
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.properties;
DROP POLICY IF EXISTS "Members can read their property" ON public.properties;
DROP POLICY IF EXISTS "Members can update their property" ON public.properties;
DROP POLICY IF EXISTS "Service role full access on properties" ON public.properties;

-- Service role: acceso total (para API /api/db)
CREATE POLICY "Service role full access on properties"
  ON public.properties FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Usuarios autenticados: solo ven las propiedades a las que pertenecen
CREATE POLICY "Members can read their property"
  ON public.properties FOR SELECT TO authenticated
  USING (id = ANY(get_user_property_ids()));

-- Usuarios autenticados: pueden actualizar solo su propia propiedad
CREATE POLICY "Members can update their property"
  ON public.properties FOR UPDATE TO authenticated
  USING (id = ANY(get_user_property_ids()))
  WITH CHECK (id = ANY(get_user_property_ids()));

-- ── unit_types ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.unit_types;
DROP POLICY IF EXISTS "Members can access their unit_types" ON public.unit_types;
DROP POLICY IF EXISTS "Service role full access on unit_types" ON public.unit_types;

CREATE POLICY "Service role full access on unit_types"
  ON public.unit_types FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members can access their unit_types"
  ON public.unit_types FOR ALL TO authenticated
  USING (property_id = ANY(get_user_property_ids()))
  WITH CHECK (property_id = ANY(get_user_property_ids()));

-- ── units ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.units;
DROP POLICY IF EXISTS "Members can access their units" ON public.units;
DROP POLICY IF EXISTS "Service role full access on units" ON public.units;

CREATE POLICY "Service role full access on units"
  ON public.units FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members can access their units"
  ON public.units FOR ALL TO authenticated
  USING (property_id = ANY(get_user_property_ids()))
  WITH CHECK (property_id = ANY(get_user_property_ids()));

-- ── roles ──────────────────────────────────────────────────────────────────
-- Los roles son globales (no tienen property_id), solo lectura para autenticados.
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;
DROP POLICY IF EXISTS "Service role full access on roles" ON public.roles;

CREATE POLICY "Service role full access on roles"
  ON public.roles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT TO authenticated
  USING (true);

-- ── team_members ───────────────────────────────────────────────────────────
-- Cada usuario solo puede ver los miembros de sus propiedades.
-- El service role mantiene acceso total (para sincronización desde /api/db).
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.team_members;
DROP POLICY IF EXISTS "Members can read their team" ON public.team_members;
DROP POLICY IF EXISTS "Members can update own profile" ON public.team_members;
DROP POLICY IF EXISTS "Service role full access on team_members" ON public.team_members;

CREATE POLICY "Service role full access on team_members"
  ON public.team_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members can read their team"
  ON public.team_members FOR SELECT TO authenticated
  USING (property_id = ANY(get_user_property_ids()) OR email = auth.jwt() ->> 'email');

CREATE POLICY "Members can update own profile"
  ON public.team_members FOR UPDATE TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- ── bookings ───────────────────────────────────────────────────────────────
-- NOTA: En la arquitectura actual, bookings se gestiona vía system_state (JSONB),
-- no directamente desde esta tabla. Sin embargo, si en el futuro se normaliza,
-- esta política estará lista.
DROP POLICY IF EXISTS "Enable all access for MVP" ON public.bookings;
DROP POLICY IF EXISTS "Members can access their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role full access on bookings" ON public.bookings;

CREATE POLICY "Service role full access on bookings"
  ON public.bookings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Members can access their bookings"
  ON public.bookings FOR ALL TO authenticated
  USING (property_id = ANY(get_user_property_ids()))
  WITH CHECK (property_id = ANY(get_user_property_ids()));
