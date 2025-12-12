import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  // Check standard process.env (Node/Webpack)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
  }
  // Check standard import.meta.env (Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
  }
  return undefined;
};

// Configuration
// In production, these must be set in your deployment platform (Vercel, Netlify, etc.)
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://zhnqltgcfpxnrmozwdih.supabase.co';
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobnFsdGdjZnB4bnJtb3p3ZGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTkxMTcsImV4cCI6MjA4MTA5NTExN30.Oh_5J_qK34ha4kOP8yTjs20ViUIkd76B2jJzlNZF7_0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});