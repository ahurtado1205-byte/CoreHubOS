const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  try {
    const envData = fs.readFileSync('.env.local', 'utf8');
    envData.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
  } catch(e) {
    console.error("Error loading env:", e);
  }
}

async function run() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan variables de entorno para Supabase.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  function stringToUuid(str) {
    if (!str) return null;
    if (str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return str;
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return `${hash.substr(0,8)}-${hash.substr(8,4)}-${hash.substr(12,4)}-${hash.substr(16,4)}-${hash.substr(20,12)}`;
  }

  console.log("Iniciando ETL de system_state -> Tablas SQL");
  
  // 1. Obtener la data (del archivo local_db.json que es espejo de system_state para facilitar)
  let data;
  try {
    const raw = fs.readFileSync('./local_db.json', 'utf8');
    data = JSON.parse(raw);
  } catch(e) {
    console.error("No se pudo leer local_db.json:", e.message);
    process.exit(1);
  }

  // 2. Definimos orden para respetar las Foreign Keys
  // properties -> roles -> team_members -> unit_types -> units -> bookings -> etc.
  
  // PROPERTIES
  if (data.properties) {
    console.log(`Migrando ${data.properties.length} properties...`);
    for (const p of data.properties) {
      const { error } = await supabase.from('properties').upsert({
        id: stringToUuid(p.id),
        name: p.name,
        location: p.location,
        logo: p.logo
      });
      if (error) console.error("Error property:", p.id, error.message);
    }
  }

  // ROLES
  if (data.roles) {
    console.log(`Migrando ${data.roles.length} roles...`);
    for (const r of data.roles) {
      const { error } = await supabase.from('roles').upsert({
        id: stringToUuid(r.id),
        name: r.name,
        description: r.description,
        permissions: r.permissions || []
      });
      if (error) console.error("Error role:", r.id, error.message);
    }
  }

  // TEAM MEMBERS
  if (data.teamMembers) {
    console.log(`Migrando ${data.teamMembers.length} team members...`);
    for (const tm of data.teamMembers) {
      const { error } = await supabase.from('team_members').upsert({
        id: stringToUuid(tm.id),
        first_name: tm.first_name,
        last_name: tm.last_name,
        email: tm.email,
        role_id: stringToUuid(tm.role_id),
        property_id: stringToUuid(tm.property_id),
        status: tm.status || 'active'
      });
      if (error) console.error("Error team member:", tm.email, error.message);
    }
  }

  // UNIT TYPES
  if (data.unitTypes) {
    console.log(`Migrando ${data.unitTypes.length} unit types...`);
    for (const ut of data.unitTypes) {
      const { error } = await supabase.from('unit_types').upsert({
        id: stringToUuid(ut.id),
        property_id: stringToUuid(ut.property_id),
        name: ut.name,
        description: ut.description,
        base_price: ut.base_price || 0,
        max_pax: ut.max_pax || 2,
        amenities: ut.amenities || []
      });
      if (error) console.error("Error unit type:", ut.id, error.message);
    }
  }

  // UNITS
  if (data.units) {
    console.log(`Migrando ${data.units.length} units...`);
    for (const u of data.units) {
      const { error } = await supabase.from('units').upsert({
        id: stringToUuid(u.id),
        property_id: stringToUuid(u.property_id),
        unit_type_id: stringToUuid(u.unit_type_id),
        name: u.name,
        status: u.status,
        housekeeping_status: u.housekeeping_status,
        notes: u.notes
      });
      if (error) console.error("Error unit:", u.id, error.message);
    }
  }

  // QUOTES
  if (data.quotes) {
    console.log(`Migrando ${data.quotes.length} quotes...`);
    for (const q of data.quotes) {
      const { error } = await supabase.from('quotes').upsert({
        id: stringToUuid(q.id),
        property_id: stringToUuid(q.property_id),
        first_name: q.first_name || '',
        last_name: q.last_name || '',
        email: q.email || '',
        phone: q.phone || '',
        nationality: q.nationality || '',
        check_in: q.check_in,
        check_out: q.check_out,
        pax: q.pax || 1,
        rooms_count: q.rooms_count || 1,
        unit_type_id: stringToUuid(q.unit_type_id),
        rate_plan_id: stringToUuid(q.rate_plan_id),
        nightly_rate: q.nightly_rate || 0,
        total_nights: q.total_nights || 1,
        subtotal: q.subtotal || 0,
        discount_type: q.discount_type || 'none',
        discount_value: q.discount_value || 0,
        total_amount: q.total_amount || 0,
        status: q.status || 'draft',
        source: q.source || '',
        expiration_date: q.expiration_date,
        follow_up_date: q.follow_up_date,
        notes: q.notes || ''
      });
      if (error) console.error("Error quote:", q.id, error.message);
    }
  }

  // BOOKINGS
  if (data.bookings) {
    console.log(`Migrando ${data.bookings.length} bookings...`);
    for (const b of data.bookings) {
      const { error } = await supabase.from('bookings').upsert({
        id: stringToUuid(b.id),
        property_id: stringToUuid(b.property_id),
        quote_id: stringToUuid(b.quote_id),
        first_name: b.first_name || '',
        last_name: b.last_name || '',
        email: b.email || '',
        phone: b.phone || '',
        document_id: b.document_id || '',
        nationality: b.nationality || '',
        check_in: b.check_in,
        check_out: b.check_out,
        pax: b.pax || 2,
        rooms_count: b.rooms_count || 1,
        room_id: stringToUuid(b.room_id),
        unit_type_id: stringToUuid(b.unit_type_id),
        rate_plan_id: stringToUuid(b.rate_plan_id),
        total_nights: b.total_nights || 1,
        subtotal: b.subtotal || 0,
        discount_type: b.discount_type || 'none',
        discount_value: b.discount_value || 0,
        total_amount: b.total_amount || 0,
        booking_status: b.booking_status || 'confirmed',
        source: b.source || '',
        cancellation_reason: b.cancellation_reason || '',
        pre_checkin_completed: b.pre_checkin_completed || false,
        notes: b.notes || ''
      });
      if (error) console.error("Error booking:", b.id, error.message);
    }
  }

  // PAYMENTS (Billing)
  if (data.payments) {
    console.log(`Migrando ${data.payments.length} payments...`);
    for (const p of data.payments) {
      const { error } = await supabase.from('billing_payments').upsert({
        id: stringToUuid(p.id),
        property_id: stringToUuid(p.property_id),
        booking_id: stringToUuid(p.booking_id),
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        status: p.status,
        notes: p.notes || ''
      });
      // Puede fallar si folio_id es requerido en billing_payments (dependiendo del esquema exacto)
      if (error) console.error("Error payment:", p.id, error.message);
    }
  }

  console.log("ETL Finalizado.");
}

run();
