const { createClient } = require('@supabase/supabase-js');

// Leemos las credenciales de forma segura desde el entorno
const supabaseUrl = 'https://xbehxdovbasgajxdnzqs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.log('Modo offline activo: No se detectó clave de Supabase en este archivo.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  if (!supabaseKey) return;
  try {
    const { data, error } = await supabase.from('properties').select('*');
    console.log('Properties:', data);
    console.log('Error:', error);
  } catch (e) {
    console.log('Error en la conexión:', e.message);
  }
}

check();