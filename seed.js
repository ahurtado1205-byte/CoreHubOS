const { createClient } = require('@supabase/supabase-js');

// Leemos las credenciales de forma segura desde el entorno
const supabaseUrl = 'https://xbehxdovbasgajxdnzqs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.log('Modo offline activo: No se detectó clave de Supabase en este archivo.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  if (!supabaseKey) return;
  console.log('Ejecutando seed seguro...');
  // Acá iría tu lógica de seed original mapeada con el cliente seguro
}

seed();