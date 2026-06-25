import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Server-only Supabase client with service_role privileges.
 * Use for Vault RPCs (store/get/revoke credentials) and webhook writes.
 * NEVER import this file from client components.
 */
export function createAdminClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
