import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iljhbxkrmaxctdzuovmh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsamhieGtybWF4Y3RkenVvdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzIxMTYsImV4cCI6MjA4OTUwODExNn0.MwRoSGtWo9OM61pcdEPCuv_GCt22yHWiDZuPjrYkRww';

export const supabase = createClient(supabaseUrl, supabaseKey);
