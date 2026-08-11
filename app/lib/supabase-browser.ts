import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epanlocaznmaydpnzomr.supabase.co';
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_M38jtc3RAnHaWAjkwFz_kg_xJr0R9vg';

export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function getAuthRedirectUrl() {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = configuredSite || (typeof window !== 'undefined' ? window.location.origin : '');
  return base.replace(/\/$/, '') + '/auth/callback';
}



