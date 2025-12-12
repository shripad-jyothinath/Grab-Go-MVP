import { createClient } from '@supabase/supabase-js';

// NOTE: In a real deployment, these would come from process.env.NEXT_PUBLIC_...
// For this environment, we check if they exist. If not, the AppContext will handle "Simulation Mode".
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
