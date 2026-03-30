import { createClient } from '@supabase/supabase-js';

// 🛡️ Sentinel: Removed hardcoded API keys to prevent secret exposure
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('🛡️ Sentinel: Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
