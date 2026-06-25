-- Allow credentials to be stored via encrypted backup when Supabase Vault is unavailable.

ALTER TABLE public.api_credentials
  ALTER COLUMN vault_secret_id DROP NOT NULL;

-- Drop unique constraint on vault_secret_id so multiple backup-only rows can exist
-- (only one row per user+lookup_key via existing UNIQUE constraint).
ALTER TABLE public.api_credentials
  DROP CONSTRAINT IF EXISTS api_credentials_vault_secret_id_key;
