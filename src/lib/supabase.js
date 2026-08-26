import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kgvvbmjdewnufymdviym.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6hdCBHPH-Hlj0C4h-FlvuA_yLWog1q2';
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6hdCBHPH-Hlj0C4h-FlvuA_yLWog1q2';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
