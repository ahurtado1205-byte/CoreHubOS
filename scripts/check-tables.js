const fs = require('fs/promises');
const { createClient } = require('@supabase/supabase-js');

async function loadEnv() {
  try {
    const envData = await fs.readFile('.env.local', 'utf8');
    envData.split('\\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
  } catch(e) {}
}

async function check() {
  await loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  if (error) {
    console.error("Error accessing properties:", error.message);
  } else {
    console.log("Properties table exists. Rows:", data.length);
  }
}
check();
