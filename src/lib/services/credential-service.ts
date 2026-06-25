import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  toCredentialMetadata,
  type CredentialMetadata,
} from "@/lib/credentials/metadata";
import type { ApiCredential, StoreCredentialInput } from "@/types/credentials";
import type { Json } from "@/types/database";

const CREDENTIAL_COLUMNS =
  "id, user_id, supplier_id, provider, name, lookup_key, key_hint, expires_at, is_active, metadata, created_at, updated_at";

function buildKeyHint(secret: string): string {
  if (secret.length <= 4) {
    return "****";
  }
  return `...${secret.slice(-4)}`;
}

export async function listCredentials(userId: string): Promise<ApiCredential[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("api_credentials")
    .select(CREDENTIAL_COLUMNS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list credentials: ${error.message}`);
  }

  return (data ?? []) as ApiCredential[];
}

/** Safe metadata for client — never includes vault_secret_id or decrypted secrets. */
export async function listCredentialMetadata(
  userId: string
): Promise<CredentialMetadata[]> {
  const credentials = await listCredentials(userId);
  return credentials.map(toCredentialMetadata);
}

export async function storeCredential(
  userId: string,
  input: StoreCredentialInput
): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("store_api_credential", {
    p_user_id: userId,
    p_provider: input.provider,
    p_lookup_key: input.lookupKey,
    p_secret: input.secret,
    p_name: input.name ?? null,
    p_key_hint: buildKeyHint(input.secret),
    p_supplier_id: input.supplierId ?? null,
    p_metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    throw new Error(`Failed to store credential: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to store credential: no ID returned");
  }

  return data;
}

export async function revokeCredential(
  userId: string,
  credentialId: string
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("revoke_api_credential", {
    p_credential_id: credentialId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to revoke credential: ${error.message}`);
  }
}

/**
 * Server-only: decrypt a credential for fulfillment / TikTok API calls.
 * Never expose the return value to client-side code.
 */
export async function getCredentialSecret(
  userId: string,
  credentialId: string
): Promise<string> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_api_credential_secret", {
    p_credential_id: credentialId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to decrypt credential: ${error.message}`);
  }

  if (!data) {
    throw new Error("Credential secret not found");
  }

  return data;
}

export async function getCredentialSecretByLookupKey(
  userId: string,
  lookupKey: string
): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("api_credentials")
    .select("id")
    .eq("user_id", userId)
    .eq("lookup_key", lookupKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return getCredentialSecret(userId, data.id);
}

export const storeCredentialSchema = z.object({
  provider: z.enum([
    "tiktok_shop",
    "openai",
    "anthropic",
    "supplier",
    "custom",
  ]),
  lookupKey: z
    .string()
    .min(1, "lookupKey is required")
    .max(100, "lookupKey must be 100 characters or fewer")
    .regex(
      /^[a-z0-9][a-z0-9:_-]*$/,
      "lookupKey must be lowercase alphanumeric with : _ -"
    ),
  secret: z.string().min(1, "secret is required").max(8192),
  name: z.string().max(100).optional(),
  supplierId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const revokeCredentialSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});
