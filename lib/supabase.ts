import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for browser environments
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

// NOTE: In a real deployment, these would come from process.env.NEXT_PUBLIC_...
const SUPABASE_URL = getEnv('SUPABASE_URL') || 'https://zhnqltgcfpxnrmozwdih.supabase.co';
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobnFsdGdjZnB4bnJtb3p3ZGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTkxMTcsImV4cCI6MjA4MTA5NTExN30.Oh_5J_qK34ha4kOP8yTjs20ViUIkd76B2jJzlNZF7_0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});