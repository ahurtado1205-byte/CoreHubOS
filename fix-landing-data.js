const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xbehxdovbasgajxdnzqs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.log('ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLandings() {
  // Read current state
  const { data, error } = await supabase
    .from('system_state')
    .select('data')
    .eq('key', 'global')
    .maybeSingle();

  if (error || !data) {
    console.log('ERROR:', error?.message || 'No data');
    return;
  }

  const state = data.data;

  // Fix the landing hero data
  if (state.landings && state.landings['bariloche-parejas']) {
    state.landings['bariloche-parejas'].hero.title = 'Bariloche se disfruta.';
    state.landings['bariloche-parejas'].hero.subtitle = 'De a dos, se recuerda.';
    console.log('Fixed hero title and subtitle');
  }

  state.version = (state.version || 0) + 1;
  state.updated_at = new Date().toISOString();
  state.updated_by = 'fix_script';

  const { error: writeError } = await supabase
    .from('system_state')
    .upsert({ key: 'global', data: state, updated_at: new Date().toISOString() });

  if (writeError) {
    console.log('WRITE ERROR:', writeError.message);
  } else {
    console.log('SUCCESS! Landing data fixed in Supabase.');
    console.log('  title:', state.landings['bariloche-parejas'].hero.title);
    console.log('  subtitle:', state.landings['bariloche-parejas'].hero.subtitle);
    console.log('  version:', state.version);
  }
}

fixLandings().catch(e => console.error('Fatal:', e));
