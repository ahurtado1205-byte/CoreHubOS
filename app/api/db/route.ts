import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const dbPath = join(process.cwd(), 'local_db.json');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

import { verifyServerAuth } from '@/lib/serverAuth';

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
  const auth = await verifyServerAuth(request);

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
  if (auth && auth.isGlobalAdmin) {
    return NextResponse.json(dbData);
  }

  // If authenticated but only has access to one property, return filtered state
  if (auth && !auth.isGlobalAdmin && auth.property_id) {
    const pId = auth.property_id;
    const filteredState = {
      ...dbData,
      properties: (dbData.properties || []).filter((p: any) => p.id === pId),
      units: (dbData.units || []).filter((u: any) => u.property_id === pId),
      unitTypes: (dbData.unitTypes || []).filter((ut: any) => ut.property_id === pId),
      bookings: (dbData.bookings || []).filter((b: any) => b.property_id === pId),
      quotes: (dbData.quotes || []).filter((q: any) => q.property_id === pId),
      payments: (dbData.payments || []).filter((p: any) => p.property_id === pId),
      invoices: (dbData.invoices || []).filter((i: any) => i.property_id === pId),
      teamMembers: (dbData.teamMembers || []).filter((tm: any) => tm.property_id === pId || !tm.property_id),
      maintenanceBlocks: (dbData.maintenanceBlocks || []).filter((mb: any) => mb.property_id === pId),
      housekeepingTasks: (dbData.housekeepingTasks || []).filter((hk: any) => hk.property_id === pId),
    };
    return NextResponse.json(filteredState);
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
  return NextResponse.json({ 
    error: 'Method Not Allowed. Escrituras monolíticas eliminadas. Utilice operaciones granulares hacia Supabase (Bloque 3).' 
  }, { status: 405 });
}
