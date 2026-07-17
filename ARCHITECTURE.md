# HotelFlow — Arquitectura del Sistema

## Stack Técnico

| Layer | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 16.2.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | TailwindCSS | ^4 |
| Auth + DB | Supabase | ^2.110.0 |
| Icons | Lucide React | ^1.16.0 |
| Date Utils | date-fns | ^4.3.0 |
| Validation | Zod | ^4.4.3 |
| Deployment | Vercel | - |

---

## Estructura de Módulos

```
HotelFlow/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Dashboard (48KB, main overview)
│   ├── login/                  # Authentication
│   ├── onboarding/             # First-time setup wizard
│   ├── reservations/           # → re-exports bookings/page.tsx
│   ├── bookings/               # Reservations CANONICAL (main list)
│   ├── crm/                    # CRM Pipeline CANONICAL
│   ├── sales/crm/              # → re-exports crm/page.tsx
│   ├── guests/                 # Guest directory / CDP view
│   ├── billing/                # Finance terminal CANONICAL
│   ├── finance/                # → re-exports billing/page.tsx
│   ├── night-audit/            # Night audit wizard
│   ├── roomrack/               # Room Rack Gantt CANONICAL
│   ├── operations/
│   │   ├── room-rack/          # → re-exports roomrack/page.tsx
│   │   └── housekeeping/       # Housekeeping board
│   ├── reports/                # Analytics + KPIs
│   │   ├── occupancy/
│   │   ├── cancellations/
│   │   └── hsk/
│   ├── marketing/              # Marketing center (funnels, landings, web editor)
│   ├── settings/
│   │   ├── inventory/          # Properties, Unit Types, Units, Colors, Templates
│   │   ├── rates/              # Rate plans, rules, daily rates, promotions
│   │   ├── team/               # Team members, roles, permissions
│   │   ├── booking-engine/     # Booking engine settings
│   │   └── website/            # Website editor
│   ├── book/[propertyId]/      # PUBLIC: Booking engine
│   ├── precheckin/[id]/        # PUBLIC: Pre check-in form
│   ├── w/[propertyId]/         # PUBLIC: Property website
│   ├── l/[slug]/               # PUBLIC: Landing pages
│   ├── funnels/[slug]/         # Funnel viewer + editor
│   └── api/
│       ├── db/                 # Central state API (GET/POST)
│       ├── billing/[...slug]/  # Billing operations API
│       ├── upload/             # File upload endpoint
│       └── webhooks/           # Payment webhooks (Stripe, MP, Adyen)
├── context/
│   └── PMSContext.tsx          # Global state provider (1040 lines)
├── components/                 # Shared UI components
├── lib/
│   ├── supabase.ts             # Supabase client singleton
│   ├── pricingEngine.ts        # Rate calculation engine
│   ├── billingSchemas.ts       # Zod validation schemas
│   ├── funnelConfig.ts         # Funnel/landing configuration
│   ├── guestService.ts         # CDP guest deduplication
│   ├── themeConfig.ts          # Website theme presets
│   ├── webhookValidator.ts     # Webhook HMAC validation
│   └── integrations/
│       ├── stripe/             # Stripe payment intents
│       ├── mercadopago/        # MercadoPago payments
│       └── arca/               # Argentine AFIP/ARCA fiscal
├── services/
│   ├── billingService.ts       # Billing ledger service
│   ├── communicationTemplateService.ts
│   └── quoteService.ts
├── types/
│   ├── index.ts                # Core domain types
│   ├── inventory.ts            # Unit, UnitType, RatePlan types
│   └── team.ts                 # Role, TeamMember types
├── mock/                       # Seed/demo data
├── proxy.ts                    # Route protection proxy (Next.js 16)
└── supabase/                   # Supabase migrations (if any)
```

---

## Arquitectura de Datos

### Patrón Principal: Single Document State
Todo el estado de la aplicación se serializa como un único JSON en la tabla `system_state` de Supabase.

```
Supabase: system_state table
  key: 'global'
  data: {
    properties: Property[]
    bookings: Booking[]
    quotes: Quote[]
    units: Unit[]
    unitTypes: UnitType[]
    ratePlans: RatePlan[]
    rateRules: RateRule[]
    dailyRates: DailyRate[]
    promotions: Promotion[]
    leads: Lead[]
    contacts: Contact[]
    opportunities: Opportunity[]
    activities: Activity[]
    tasks: Task[]
    payments: Payment[]
    invoices: Invoice[]
    templates: CommunicationTemplate[]
    teamMembers: TeamMember[]
    roles: Role[]
    bookingColors: Record<string, {label, colorClass}>
    funnels: FunnelMapping
    landings: Record<string, LandingConfig>
    version: number (optimistic locking)
    updated_at: ISO timestamp
    updated_by: email | 'guest_booking_engine'
  }
```

### Flujo de Datos

```
1. App Boot
   PMSContext mounts
   → fetch GET /api/db?property_id={id}
   → API reads from Supabase system_state (or local_db.json in dev)
   → State hydrates all React state

2. Mutations
   User action → PMSContext function (addBooking, updateQuote, etc.)
   → setXxx() (optimistic update, UI updates immediately)
   → triggerImmediateSave() OR debounced auto-save (1500ms)
   → POST /api/db with full state snapshot
   → API validates + upserts to Supabase

3. Concurrency Control
   Each write includes 'version' field
   API checks incomingVersion >= currentVersion
   Conflict → 409 response → user sees alert
```

---

## Autenticación

### Flujo de Login

```
User enters credentials
  → supabase.auth.signInWithPassword()
  → Supabase sets sb-*-auth-token cookie automatically
  → PMSContext.isAuthenticated = true
  → onAuthStateChange fires → fetches team_members profile
  → Router pushes to '/'

Proxy (Proxy file)
  → Checks for sb-*-auth-token cookie (Supabase auth)
  → OR hotelflow_demo_session cookie (demo/local mode)
  → If neither → redirect to /login
```

### Flujo Demo (sin Supabase)

```
User clicks "Entrar como Invitado" → selects demo type
  → document.cookie = 'hotelflow_demo_session=true'
  → initializeSystem('demo_1' | 'demo_2' | 'demo_3')
  → Mock data loaded into React state
  → POST /api/db saves mock state (file or Supabase)
  → Router pushes to '/'
```

### Rutas Públicas (sin auth)
- `/login`, `/onboarding`
- `/book/[propertyId]` — Motor de reservas
- `/w/[propertyId]` — Sitio web de la propiedad  
- `/l/[slug]` — Landing pages
- `/precheckin/[id]` — Pre check-in de huéspedes
- `/api/*` — Las API routes manejan su propia autorización

---

## API Routes

### `GET /api/db`
- **Auth:** Bearer token verificado via Supabase service role
- **Authorized:** Devuelve estado completo
- **Unauthorized:** Devuelve catálogo público (unidades, tipos, disponibilidad anónima)
- **Query params:** `property_id`, `searchCode`, `lastName`, `precheckinId`

### `POST /api/db`
- **Auth:** Bearer token requerido para escrituras admin
- **Sin auth:** Solo permite agregar 1 booking o 1 quote (booking engine)
- **Validaciones:** Payload schema, overbooking check, versión concurrency
- **Storage:** Supabase primary → local_db.json fallback (solo dev)

### `POST /api/billing/folios` → Create billing folio
### `POST /api/billing/folios/{id}/lines` → Add charge
### `POST /api/billing/payment-intents` → Create payment (Stripe/MP)
### `POST /api/billing/invoices` → Issue invoice (ARCA/AFIP fiscal)
### `GET /api/billing/reports/daily-close` → Daily revenue report

---

## Tablas Supabase

| Tabla | Uso | Notas |
|---|---|---|
| `system_state` | Estado global de la app | key='global', data=JSONB |
| `team_members` | Autorización de usuarios | Vincula auth.users.email |
| `properties` | (Opcional) Solo usado en signup | Datos en system_state.data |

---

## Integraciones Externas

| Servicio | Uso | Archivo |
|---|---|---|
| Supabase Auth | Login, sesiones, tokens | `lib/supabase.ts` |
| Supabase DB | Persistencia de estado | `app/api/db/route.ts` |
| Stripe | Pagos con tarjeta | `lib/integrations/stripe/` |
| MercadoPago | Pagos LATAM | `lib/integrations/mercadopago/` |
| ARCA/AFIP | Facturación fiscal AR | `lib/integrations/arca/` |
| Open-Meteo | Clima en dashboard | Dashboard hardcoded |
| open.er-api.com | Tipo de cambio | Dashboard hardcoded |

---

## Módulo de Precios

### PricingEngine (`lib/pricingEngine.ts`)
1. Busca reglas tarifarias para el unit_type_id + rate_plan_id
2. Aplica reglas por temporada (fecha)
3. Aplica tarifas diarias personalizadas (DailyRate) si existen
4. Aplica descuentos (porcentaje o fijo)
5. Aplica promociones (código)
6. Suma noches × tarifa aplicable

### BillingService (`services/billingService.ts`)
- Ledger de doble entrada (append-only)
- Versión optimista (409 en conflicto)
- IVA: 21% hardcoded (pendiente configuración por propiedad)
- Modos: Supabase / localStorage (client) / filesystem (server dev)

---

## Módulo de Marketing

### Funnels
- Configurados en `lib/funnelConfig.ts`
- Cada funnel tiene: quiz preguntas → leads → cotizaciones → reservas
- URL: `/funnels/[slug]` (vista) y `/funnels/[slug]/edit` (editor)

### Landings
- Configuradas en PMSContext.landings
- URL: `/l/[slug]`

### Motor de Reservas
- URL: `/book/[propertyId]`
- Lee `/api/db` sin autenticación
- Devuelve catálogo público (tipos, disponibilidad anónima, tarifas)
- Escribe nueva reserva via POST /api/db (sin auth, solo +1 booking)
