import { z } from "zod";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "@/lib/credentials/secret-cipher";
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

function isVaultStorageError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("vault") ||
    normalized.includes("pgsodium") ||
    normalized.includes("create_secret") ||
    normalized.includes("update_secret")
  );
}

async function upsertCredentialBackup(
  credentialId: string,
  secret: string,
  options?: { required?: boolean }
): Promise<void> {
  const admin = createAdminClient();
  const ciphertext = encryptCredentialSecret(secret);

  const { error } = await admin.from("credential_secret_backups").upsert(
    {
      credential_id: credentialId,
      ciphertext,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "credential_id" }
  );

  if (error) {
    const message = `Failed to store credential backup: ${error.message}`;
    if (options?.required) {
      throw new Error(
        `${message} Run supabase/migrations/20250625120000_credential_secret_backups.sql in the Supabase SQL Editor.`
      );
    }
    console.warn("[credential-service]", message);
  }
}

async function storeCredentialViaEncryptedBackup(
  userId: string,
  input: StoreCredentialInput
): Promise<string> {
  const admin = createAdminClient();
  const keyHint = buildKeyHint(input.secret);

  const { data: existing, error: existingError } = await admin
    .from("api_credentials")
    .select("id")
    .eq("user_id", userId)
    .eq("lookup_key", input.lookupKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to load existing credential: ${existingError.message}`
    );
  }

  let credentialId = existing?.id;

  if (credentialId) {
    const { error: updateError } = await admin
      .from("api_credentials")
      .update({
        provider: input.provider,
        name: input.name ?? input.lookupKey,
        key_hint: keyHint,
        supplier_id: input.supplierId ?? null,
        metadata: (input.metadata ?? {}) as Json,
        is_active: true,
        vault_secret_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (updateError) {
      throw new Error(`Failed to update credential: ${updateError.message}`);
    }
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("api_credentials")
      .insert({
        user_id: userId,
        provider: input.provider,
        lookup_key: input.lookupKey,
        name: input.name ?? input.lookupKey,
        key_hint: keyHint,
        supplier_id: input.supplierId ?? null,
        metadata: (input.metadata ?? {}) as Json,
        is_active: true,
        vault_secret_id: null,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      throw new Error(
        insertError?.message ??
          "Failed to insert credential. Run supabase/migrations/20250626120000_credential_vault_optional.sql in Supabase if vault_secret_id is still required."
      );
    }

    credentialId = inserted.id;
  }

  await upsertCredentialBackup(credentialId, input.secret, { required: true });
  return credentialId;
}

async function readCredentialBackup(credentialId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("credential_secret_backups")
    .select("ciphertext")
    .eq("credential_id", credentialId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read credential backup: ${error.message}`);
  }

  if (!data?.ciphertext) {
    return null;
  }

  try {
    return decryptCredentialSecret(data.ciphertext);
  } catch {
    return null;
  }
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
    if (isVaultStorageError(error.message)) {
      console.warn(
        "[credential-service] Vault storage unavailable, using encrypted backup:",
        error.message
      );
      return storeCredentialViaEncryptedBackup(userId, input);
    }

    throw new Error(`Failed to store credential: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to store credential: no ID returned");
  }

  await upsertCredentialBackup(data, input.secret);

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

  const { data: credentialRow, error: credentialError } = await admin
    .from("api_credentials")
    .select("vault_secret_id")
    .eq("id", credentialId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (credentialError) {
    throw new Error(`Failed to load credential: ${credentialError.message}`);
  }

  if (!credentialRow) {
    throw new Error("Credential not found or inactive.");
  }

  if (!credentialRow.vault_secret_id) {
    const backupOnly = await readCredentialBackup(credentialId);
    if (backupOnly) {
      return backupOnly;
    }

    throw new Error(
      "Credential secret not found. Re-save your TikTok credentials in Settings."
    );
  }

  const { data, error } = await admin.rpc("get_api_credential_secret", {
    p_credential_id: credentialId,
    p_user_id: userId,
  });

  if (error) {
    const backup = await readCredentialBackup(credentialId);
    if (backup) {
      return backup;
    }

    throw new Error(`Failed to decrypt credential: ${error.message}`);
  }

  if (data && data.trim().length > 0) {
    return data;
  }

  const backup = await readCredentialBackup(credentialId);
  if (backup) {
    return backup;
  }

  throw new Error(
    "Credential secret not found. Re-save your TikTok API token in Settings — the encrypted backup may be missing or Vault is not configured on this database."
  );
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
