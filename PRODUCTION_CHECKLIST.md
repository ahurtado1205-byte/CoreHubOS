# HotelFlow — Production Checklist

## Checklist pre-deploy (verificar CADA VEZ antes de publicar)

### ✅ Código y Calidad

- [ ] `npm run typecheck` → **0 errores TypeScript**
- [ ] `npm run lint` → **0 errores importantes**
- [ ] `npm run build` → **Build exitoso, 0 errores**
- [ ] Sin archivos `.txt`, `.html` u otros archivos no relacionados en el root

### ✅ Seguridad

- [ ] Sin secretos hardcodeados en el código (buscar: `sb_secret`, `service_role`, `password = '`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo en variables server-side de Vercel (NO `NEXT_PUBLIC_*`)
- [ ] `.env.local` and `.env.production.local` **no commiteados** (verificar con `git status`)
- [ ] `proxy.ts` presente y protege rutas privadas
- [ ] Rutas públicas (`/book/`, `/w/`, `/l/`, `/precheckin/`) accesibles sin login

### ✅ Variables de Entorno (Vercel)

```bash
npx vercel env ls
# Verificar que existan:
```

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → Production **y** Preview
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Production **y** Preview  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Production (solo server)

### ✅ Base de Datos (Supabase)

- [ ] Tabla `system_state` existe con fila `key = 'global'`
- [ ] Tabla `team_members` existe con al menos un admin registrado
- [ ] RLS activado en ambas tablas
- [ ] Email del admin en `team_members` coincide con el email en Supabase Auth

### ✅ Funcional (Manual Quick Check)

- [ ] Login con credenciales reales funciona
- [ ] Login demo (Empresa 1/2/3) funciona sin Supabase
- [ ] Logout redirige a `/login`
- [ ] Dashboard carga datos reales
- [ ] Crear reserva → aparece en la lista → persiste al recargar
- [ ] Editar reserva → cambios persisten
- [ ] Room Rack muestra habitaciones y reservas
- [ ] Night Audit avanza el día correctamente
- [ ] Motor de reservas `/book/{property_id}` funciona públicamente

### ✅ Redirects

- [ ] `/bookings` → `/reservations` (301)
- [ ] `/crm` → `/sales/crm` (301)
- [ ] `/roomrack` → `/operations/room-rack` (301)
- [ ] `/billing` → `/finance` (301)
- [ ] `/night-audit` → sirve su propia página (NO redirect)

### ✅ Post-Deploy

- [ ] Deploy exitoso en Vercel dashboard
- [ ] URL permanente responde: https://hotel-flow-iota.vercel.app
- [ ] Login funciona en producción
- [ ] Datos del hotel se cargan desde Supabase

---

## Comando de Deploy

```bash
# Verificar todo antes
npm run typecheck && npm run build

# Deploy
npx vercel --prod

# Confirmar URL permanente
# https://hotel-flow-iota.vercel.app
```

---

## SQL de Emergencia

### Reset de versión (si hay conflictos persistentes)
```sql
UPDATE system_state 
SET data = jsonb_set(data, '{version}', '0')
WHERE key = 'global';
```

### Ver estado actual
```sql
SELECT 
  key,
  data->>'version' as version,
  data->>'updated_by' as last_editor,
  updated_at
FROM system_state;
```
