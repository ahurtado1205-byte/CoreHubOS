const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xbehxdovbasgajxdnzqs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.log('ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('=== CHECKING system_state TABLE ===');
  
  const { data, error } = await supabase
    .from('system_state')
    .select('key, updated_at')
    .limit(10);
  
  if (error) {
    console.log('ERROR reading system_state:', error.message, error.code, error.details);
    console.log('The system_state table might not exist!');
    return;
  }
  
  console.log('Rows found:', data?.length || 0);
  if (data) {
    data.forEach(row => console.log(`  key="${row.key}" updated_at="${row.updated_at}"`));
  }

  // Now read the actual landing data
  const { data: stateData, error: stateError } = await supabase
    .from('system_state')
    .select('data')
    .eq('key', 'global')
    .maybeSingle();

  if (stateError) {
    console.log('ERROR reading global state:', stateError.message);
    return;
  }

  if (!stateData) {
    console.log('NO global state row found! The database is empty.');
    return;
  }

  const dbData = stateData.data;
  console.log('\n=== LANDINGS IN SUPABASE ===');
  if (dbData.landings) {
    Object.keys(dbData.landings).forEach(slug => {
      const landing = dbData.landings[slug];
      console.log(`  slug="${slug}"`);
      console.log(`    title="${landing.hero?.title}"`);
      console.log(`    subtitle="${landing.hero?.subtitle}"`);
    });
  } else {
    console.log('  No landings found in state!');
  }

  console.log('\n=== STATE VERSION ===');
  console.log(`  version=${dbData.version}`);
  console.log(`  updated_at=${dbData.updated_at}`);
  console.log(`  updated_by=${dbData.updated_by}`);
}

debug().catch(e => console.error('Fatal:', e));
