import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates an administrative Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
 *
 * CRITICAL SECURITY NOTICE:
 * This client bypasses Row Level Security (RLS).
 * It MUST ONLY be executed in trusted server-side environments (Server Actions, Route Handlers).
 * It must NEVER be exposed or imported into browser / client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase URL: NEXT_PUBLIC_SUPABASE_URL must be defined."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase Service Role Key: SUPABASE_SERVICE_ROLE_KEY must be defined in server environment."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
