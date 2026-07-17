import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const dbPath = join(process.cwd(), 'local_db.json');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

// Development bypass validation helper
function checkCanBypassAuth() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowLocalUnauth = process.env.ALLOW_UNAUTHENTICATED_LOCAL_DB === 'true';
  const isVercel = !!process.env.VERCEL;
  return isDevelopment && allowLocalUnauth && !isVercel && !isSupabaseConfigured;
}

// Token session helper
async function getAuthUser(request: Request) {
  if (checkCanBypassAuth()) {
    return { user: { email: 'local-dev@hotelflow.local' } };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { user };
  } catch (e) {
    console.error('Auth verification failed:', e);
    return null;
  }
}

// User role/access authorization validation
async function checkUserAuthorization(email: string) {
  if (checkCanBypassAuth()) {
    return true;
  }

  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    // Look up user inside system state data or team_members table if available
    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Failed to lookup user authorization:', error);
      return false;
    }

    // In a Single Document State, if they have a registered member profile, they are authorized
    return !!member;
  } catch (e) {
    console.error('Auth validation failed:', e);
    return false;
  }
}

// Payload Validation Schema
const ALLOWED_KEYS = new Set([
  'properties', 'quotes', 'bookings', 'units', 'unitTypes', 'ratePlans', 'rateRules', 'dailyRates', 'promotions',
  'leads', 'contacts', 'opportunities', 'activities', 'tasks', 'payments', 'invoices', 'maintenanceBlocks',
  'housekeepingTasks', 'templates', 'roles', 'teamMembers', 'bookingColors', 'currentPropertyId', 'systemDate',
  'version', 'updated_at', 'updated_by', 'funnels', 'landings'
]);

function validatePayload(data: any): string | null {
  if (!data || typeof data !== 'object') {
    return 'Invalid JSON body structure';
  }

  // Check for unknown unexpected keys
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) {
      return `Unexpected key in payload: ${key}`;
    }
  }

  // Validate critical collections are arrays
  const arrayFields = ['properties', 'quotes', 'bookings', 'units', 'unitTypes', 'ratePlans', 'payments'];
  for (const field of arrayFields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      return `Field '${field}' must be an array`;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  let isAuthorizedAdmin = false;
  if (auth) {
    isAuthorizedAdmin = await checkUserAuthorization(auth.user.email!);
  }

  let dbData: any = {};
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
      const { data, error } = await supabase
        .from('system_state')
        .select('data')
        .eq('key', 'global')
        .maybeSingle();
      
      if (!error && data?.data) {
        dbData = data.data;
      }
    } catch (e) {
      console.error('Failed to load state from Supabase:', e);
    }
  } else {
    try {
      const data = await readFile(dbPath, 'utf8');
      dbData = JSON.parse(data);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
      }
    }
  }

  // If the user is an authorized admin, return full state
  if (isAuthorizedAdmin) {
    return NextResponse.json(dbData);
  }

  // Guest/Booking Engine/Funnels: strip PII and return public catalog
  const { searchParams } = new URL(request.url);
  const searchCode = searchParams.get('searchCode')?.trim();
  const lastName = searchParams.get('lastName')?.trim().toLowerCase();
  const precheckinId = searchParams.get('precheckinId')?.trim();

  const sanitizedBookings = (dbData.bookings || []).map((b: any) => {
    const isTarget = 
      (precheckinId && b.id === precheckinId) ||
      (searchCode && lastName && 
        (b.id === searchCode || b.confirmation_id?.toLowerCase() === searchCode.toLowerCase()) && 
        b.last_name?.toLowerCase().trim() === lastName);

    if (isTarget) {
      return b;
    }

    return {
      id: b.id,
      room_id: b.room_id,
      check_in: b.check_in,
      check_out: b.check_out,
      booking_status: b.booking_status
    };
  });

  const publicState = {
    properties: dbData.properties || [],
    unitTypes: dbData.unitTypes || [],
    ratePlans: dbData.ratePlans || [],
    promotions: dbData.promotions || [],
    funnels: dbData.funnels || {},
    landings: dbData.landings || {},
    bookingColors: dbData.bookingColors || {},
    units: dbData.units || [],
    bookings: sanitizedBookings,
    systemDate: dbData.systemDate || new Date().toISOString().split('T')[0],
    version: dbData.version || 0,
    quotes: [],
    leads: [],
    contacts: [],
    opportunities: [],
    activities: [],
    tasks: [],
    payments: [],
    invoices: [],
    maintenanceBlocks: dbData.maintenanceBlocks || [],
    housekeepingTasks: [],
    templates: dbData.templates || [],
    roles: [],
    teamMembers: []
  };

  return NextResponse.json(publicState);
}

export async function POST(request: Request) {
  // Size limit validation (2MB max size check)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload Too Large: Maximum allowed size is 2MB' }, { status: 400 });
  }

  let incomingData: any;
  try {
    incomingData = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Bad Request: Invalid JSON body format' }, { status: 400 });
  }

  // Structural payload checks
  const validationError = validatePayload(incomingData);
  if (validationError) {
    return NextResponse.json({ error: `Bad Request: ${validationError}` }, { status: 400 });
  }

  // Load current database state for concurrency checks
  let currentState: any = {};
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
      const { data } = await supabase.from('system_state').select('data').eq('key', 'global').maybeSingle();
      if (data?.data) currentState = data.data;
    } catch (e) {
      console.error('Failed concurrency read:', e);
    }
  } else {
    try {
      const data = await readFile(dbPath, 'utf8');
      currentState = JSON.parse(data);
    } catch {}
  }

  // Auth and Guest Booking Exception Check
  const auth = await getAuthUser(request);
  if (!auth) {
    // If not logged in, verify if it's only a guest reservation or quote submission
    const currentBCount = Array.isArray(currentState.bookings) ? currentState.bookings.length : 0;
    const incomingBCount = Array.isArray(incomingData.bookings) ? incomingData.bookings.length : 0;
    const currentQCount = Array.isArray(currentState.quotes) ? currentState.quotes.length : 0;
    const incomingQCount = Array.isArray(incomingData.quotes) ? incomingData.quotes.length : 0;

    let isValidGuestWrite = false;
    
    // Case 1: Guest added a booking (prepended in state)
    if (incomingBCount === currentBCount + 1) {
      const allExistingsMatch = (currentState.bookings || []).every((b: any, index: number) => {
        const incomingB = incomingData.bookings[index + 1];
        return incomingB && incomingB.id === b.id;
      });
      if (allExistingsMatch) {
        isValidGuestWrite = true;
      }
    }
    // Case 2: Guest updated a booking (Pre-checkin express updates)
    else if (incomingBCount === currentBCount) {
      const modifiedBooking = incomingData.bookings.find((ib: any) => {
        const cb = currentState.bookings.find((x: any) => x.id === ib.id);
        if (!cb) return false;
        return JSON.stringify(ib) !== JSON.stringify(cb);
      });

      if (modifiedBooking) {
        const currentB = currentState.bookings.find((x: any) => x.id === modifiedBooking.id);
        if (currentB) {
          // Security Validation Check: Ensure they did not tamper with critical billing/inventory variables
          const criticalFields = ['subtotal', 'total_amount', 'check_in', 'check_out', 'room_id', 'unit_type_id', 'rate_plan_id', 'booking_status', 'discount_type', 'discount_value'];
          let hasCriticalChanges = false;
          for (const field of criticalFields) {
            if (JSON.stringify(modifiedBooking[field]) !== JSON.stringify(currentB[field])) {
              hasCriticalChanges = true;
              break;
            }
          }
          if (!hasCriticalChanges) {
            isValidGuestWrite = true;
          }
        }
      }
    }
    // Case 3: Guest added a quote
    else if (incomingQCount === currentQCount + 1 || incomingQCount === currentQCount) {
      isValidGuestWrite = true;
    }

    if (!isValidGuestWrite) {
      return NextResponse.json({ error: 'Unauthorized: Access token is missing or invalid' }, { status: 401 });
    }
  } else {
    // Authenticated but check authorization for administrative writes
    const isAuthorized = await checkUserAuthorization(auth.user.email!);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: User has no permissions to access this property' }, { status: 403 });
    }
  }

  // Version Concurrency Check (Optimistic Locking)
  const incomingVersion = incomingData.version !== undefined ? parseInt(incomingData.version) : 0;
  const currentVersion = currentState.version !== undefined ? parseInt(currentState.version) : 0;

  if (auth && currentVersion > 0 && incomingVersion < currentVersion) {
    const isSameUser = currentState.updated_by === auth.user.email;
    if (!isSameUser) {
      return NextResponse.json({ 
        error: 'Conflict: The database has been updated by another user. Please reload.',
        currentVersion,
        incomingVersion
      }, { status: 409 });
    }
  }

  // Server-side Overlap Check for active bookings
  const INVENTORY_BLOCKING_STATUSES = ['tentative', 'confirmed', 'checked_in'];
  const newBookings = incomingData.bookings || [];
  
  for (let i = 0; i < newBookings.length; i++) {
    const b1 = newBookings[i];
    if (b1.booking_status === 'cancelled' || !b1.room_id) continue;
    if (!INVENTORY_BLOCKING_STATUSES.includes(b1.booking_status)) continue;

    for (let j = i + 1; j < newBookings.length; j++) {
      const b2 = newBookings[j];
      if (b2.booking_status === 'cancelled' || !b2.room_id) continue;
      if (!INVENTORY_BLOCKING_STATUSES.includes(b2.booking_status)) continue;
      if (b1.room_id !== b2.room_id) continue;

      const checkIn1 = b1.check_in;
      const checkOut1 = b1.check_out;
      const checkIn2 = b2.check_in;
      const checkOut2 = b2.check_out;

      if (checkIn1 < checkOut2 && checkOut1 > checkIn2) {
        const isOversellAuthorized = (b1.notes?.includes('[Oversell Authorized]') || b2.notes?.includes('[Oversell Authorized]'));
        if (!isOversellAuthorized) {
          return NextResponse.json({ 
            error: `Conflict: Overlapping dates on Room ${b1.room_id} for ${b1.first_name} and ${b2.first_name} without explicit authorization.`
          }, { status: 409 });
        }
      }
    }
  }

  // Merge guest writes into current state to prevent admin data loss
  let stateToSave = incomingData;
  if (!auth) {
    const currentQuotes = currentState.quotes || [];
    const incomingQuotes = incomingData.quotes || [];
    const newQuotes = incomingQuotes.filter((iq: any) => !currentQuotes.some((cq: any) => cq.id === iq.id));
    
    const currentBookings = currentState.bookings || [];
    const incomingBookings = incomingData.bookings || [];
    
    // Update bookings list: merge the modified precheckin data safely
    const mergedBookings = currentBookings.map((cb: any) => {
      const ib = incomingBookings.find((x: any) => x.id === cb.id);
      if (ib) {
        // Double check no critical parameters were bypassed in incomingBooking list
        const criticalFields = ['subtotal', 'total_amount', 'check_in', 'check_out', 'room_id', 'unit_type_id', 'rate_plan_id', 'booking_status', 'discount_type', 'discount_value'];
        let hasCriticalChanges = false;
        for (const field of criticalFields) {
          if (JSON.stringify(ib[field]) !== JSON.stringify(cb[field])) {
            hasCriticalChanges = true;
            break;
          }
        }
        if (!hasCriticalChanges) {
          return ib; // Allow pre-checkin changes
        }
      }
      return cb;
    });
    
    const currentActivities = currentState.activities || [];
    const incomingActivities = incomingData.activities || [];
    const newActivities = incomingActivities.filter((ia: any) => !currentActivities.some((ca: any) => ca.id === ia.id));

    stateToSave = {
      ...currentState,
      quotes: [...newQuotes, ...currentQuotes],
      bookings: mergedBookings,
      activities: [...newActivities, ...currentActivities]
    };
  }

  // Increment version metadata
  stateToSave.version = currentVersion + 1;
  stateToSave.updated_at = new Date().toISOString();
  stateToSave.updated_by = auth ? auth.user.email : 'guest_booking_engine';

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
      const { error } = await supabase
        .from('system_state')
        .upsert({ key: 'global', data: stateToSave, updated_at: new Date().toISOString() });
      
      if (!error) {
        return NextResponse.json({ success: true, target: 'supabase', version: stateToSave.version });
      }
    } catch (e) {
      console.error('Failed to save state to Supabase:', e);
    }
  }

  // Fallback to local file writing
  try {
    await writeFile(dbPath, JSON.stringify(stateToSave, null, 2));
    return NextResponse.json({ success: true, target: 'file', version: stateToSave.version });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write database' }, { status: 500 });
  }
}
