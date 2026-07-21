import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

export interface AuthUser {
  email: string;
  property_id: string | null; // null means global admin
  isGlobalAdmin: boolean;
}

export async function verifyServerAuth(request: Request): Promise<AuthUser | null> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowLocalUnauth = process.env.ALLOW_UNAUTHENTICATED_LOCAL_DB === 'true';
  const isVercel = !!process.env.VERCEL;
  
  // Extra layer of protection: only allow local bypass from localhost
  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  if (isDevelopment && allowLocalUnauth && !isVercel && isLocalhost && !isSupabaseConfigured) {
    console.warn('⚠️ [SECURITY] Using ALLOW_UNAUTHENTICATED_LOCAL_DB bypass. This should never appear in production.');
    return { email: 'local-dev@hotelflow.local', property_id: null, isGlobalAdmin: true };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user?.email) {
      return null;
    }

    const email = user.email.toLowerCase().trim();

    // Query team_members table directly using service role
    // This securely bypasses RLS to check the real membership
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('property_id, status')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError || !member) {
      console.warn(`[SECURITY] User ${email} authenticated but not found or inactive in team_members.`);
      return null;
    }

    return {
      email,
      property_id: member.property_id || null,
      isGlobalAdmin: member.property_id === null
    };

  } catch (e) {
    console.error('[SECURITY] Server auth verification failed:', e);
    return null;
  }
}
