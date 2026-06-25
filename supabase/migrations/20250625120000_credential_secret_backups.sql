-- Fallback credential storage when Vault decrypt returns null (common if Vault
-- grants were not applied). Only service_role may read/write this table.

CREATE TABLE IF NOT EXISTS public.credential_secret_backups (
  credential_id UUID PRIMARY KEY REFERENCES public.api_credentials (id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credential_secret_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_secret_backups FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.credential_secret_backups FROM PUBLIC;
REVOKE ALL ON public.credential_secret_backups FROM authenticated;
REVOKE ALL ON public.credential_secret_backups FROM anon;
GRANT ALL ON public.credential_secret_backups TO service_role;

-- Improve Vault secret reads for service_role RPCs.
GRANT USAGE ON SCHEMA vault TO service_role;
GRANT SELECT ON vault.decrypted_secrets TO service_role;

CREATE OR REPLACE FUNCTION public.get_api_credential_secret(
  p_credential_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_secret_id UUID;
  v_owner_id UUID;
  v_plaintext TEXT;
BEGIN
  SELECT vault_secret_id, user_id
  INTO v_vault_secret_id, v_owner_id
  FROM public.api_credentials
  WHERE id = p_credential_id AND is_active = TRUE;

  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'credential not found or inactive';
  END IF;

  IF p_user_id IS NOT NULL AND v_owner_id <> p_user_id THEN
    RAISE EXCEPTION 'credential does not belong to user';
  END IF;

  SELECT decrypted_secret INTO v_plaintext
  FROM vault.decrypted_secrets
  WHERE id = v_vault_secret_id;

  IF v_plaintext IS NOT NULL AND length(trim(v_plaintext)) > 0 THEN
    RETURN v_plaintext;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_api_credential_secret FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_api_credential_secret TO service_role;
