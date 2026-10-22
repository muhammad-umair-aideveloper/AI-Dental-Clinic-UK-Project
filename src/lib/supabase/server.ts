/**
 * src/lib/supabase/server.ts
 *
 * Server-side Supabase Client & Database Access Layer
 * Supports both live Supabase instance and isolated local in-memory fallback
 * when environment variables are being initialized.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Strict Healthcare Architecture: Backend operations MUST use SUPABASE_SERVICE_ROLE_KEY exclusively (never anon key)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  // If using placeholder dummy credentials, don't attempt live network calls
  if (
    url.includes('your-project-id') ||
    key.includes('your-supabase') ||
    key.includes('your-service-role') ||
    key.includes('your-supabase-service-role-key')
  ) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return false;
  if (
    url.includes('your-project-id') ||
    key.includes('your-supabase') ||
    key.includes('your-service-role') ||
    key.includes('your-supabase-service-role-key')
  ) {
    return false;
  }
  return true;
}
