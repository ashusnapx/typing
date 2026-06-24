import { createClient } from '@supabase/supabase-js';

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  if (adminClient === null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('Supabase admin not configured — missing SUPABASE_SERVICE_ROLE_KEY');
      adminClient = null as any;
      return null;
    }
    try {
      adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } catch (err) {
      console.error('Failed to create Supabase admin client:', err);
      adminClient = null as any;
    }
  }
  return adminClient as ReturnType<typeof createClient> | null;
}
