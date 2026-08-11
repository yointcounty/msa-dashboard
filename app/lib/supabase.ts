import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epanlocaznmaydpnzomr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_M38jtc3RAnHaWAjkwFz_kg_xJr0R9vg';

export const supabase = createClient(supabaseUrl, supabaseKey);
