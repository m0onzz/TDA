-- TikTok Dropship Automator — Supabase PostgreSQL Schema (Production)
-- Run in the Supabase SQL Editor or via: supabase db push
--
-- Security model:
--   • RLS on all tenant tables — users only touch their own rows.
--   • Secrets never stored in plain columns — Vault (supabase_vault) at rest.
--   • Decryption only via SECURITY DEFINER RPCs granted to service_role.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Supabase Vault: authenticated encryption for secrets at rest.
-- On hosted Supabase this is usually pre-installed; IF NOT EXISTS is safe.
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE product_status AS ENUM (
  'draft',
  'scraping',
  'ai_processing',
  'ready_for_review',
  'published',
  'failed',
  'archived'
);

CREATE TYPE fulfillment_status AS ENUM (
  'pending',
  'routed_to_supplier',
  'supplier_confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'failed'
);

CREATE TYPE webhook_event_status AS ENUM (
  'received',
  'processing',
  'processed',
  'failed',
  'ignored'
);

CREATE TYPE supplier_region AS ENUM (
  'us',
  'us_west',
  'us_east',
  'other'
);

CREATE TYPE credential_provider AS ENUM (
  'tiktok_shop',
  'openai',
  'anthropic',
  'supplier',
  'custom'
);

-- ---------------------------------------------------------------------------
-- Users (profiles & store settings — NO raw secrets in this table)
-- Extends Supabase auth.users.
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  store_name TEXT,
  tiktok_shop_id TEXT,
  store_settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example: { "default_markup_percent": 40, "auto_publish": false }

  theme TEXT NOT NULL DEFAULT 'dark'
    CHECK (theme IN ('dark', 'light', 'midnight', 'high-contrast')),

  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_tiktok_shop_id ON public.users (tiktok_shop_id)
  WHERE tiktok_shop_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- API credentials (metadata + Vault secret reference)
-- Plaintext tokens live ONLY inside vault.secrets (encrypted on disk).
-- ---------------------------------------------------------------------------
CREATE TABLE public.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  supplier_id UUID, -- FK added after suppliers table; nullable for platform keys

  provider credential_provider NOT NULL,
  name TEXT NOT NULL,
  -- Stable lookup key for app code, e.g. "tiktok_shop:primary"
  lookup_key TEXT NOT NULL,

  -- Opaque reference to vault.secrets.id (ciphertext stored in Vault schema)
  vault_secret_id UUID NOT NULL UNIQUE,

  -- Non-sensitive hint for Settings UI (e.g. last 4 chars: "...a9f2")
  key_hint TEXT,

  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, lookup_key)
);

CREATE INDEX idx_api_credentials_user_id ON public.api_credentials (user_id);
CREATE INDEX idx_api_credentials_provider ON public.api_credentials (user_id, provider)
  WHERE is_active = TRUE;
CREATE INDEX idx_api_credentials_supplier_id ON public.api_credentials (supplier_id)
  WHERE supplier_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Suppliers with US warehouse inventory (48-hour shipping compliance)
-- ---------------------------------------------------------------------------
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  api_base_url TEXT,
  -- Supplier API keys live in api_credentials (provider = 'supplier', supplier_id = this row)
  region supplier_region NOT NULL DEFAULT 'us',
  supports_us_warehouse BOOLEAN NOT NULL DEFAULT TRUE,
  avg_fulfillment_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

ALTER TABLE public.api_credentials
  ADD CONSTRAINT api_credentials_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers (id) ON DELETE CASCADE;

CREATE INDEX idx_suppliers_user_id ON public.suppliers (user_id);
CREATE INDEX idx_suppliers_us_warehouse ON public.suppliers (user_id, supports_us_warehouse)
  WHERE supports_us_warehouse = TRUE AND is_active = TRUE;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL,

  original_supplier_url TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::JSONB,

  ai_title TEXT,
  ai_description TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  optimized_images JSONB NOT NULL DEFAULT '[]'::JSONB,

  cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
  selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',

  status product_status NOT NULL DEFAULT 'draft',
  tiktok_product_id TEXT,
  tiktok_listing_url TEXT,
  ai_processing_error TEXT,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT products_selling_price_gte_cost CHECK (selling_price >= cost_price)
);

-- Performance indexes (tenant lookups + status filtering at scale)
CREATE INDEX idx_products_user_id ON public.products (user_id);
CREATE INDEX idx_products_status ON public.products (status);
CREATE INDEX idx_products_user_status ON public.products (user_id, status);
CREATE INDEX idx_products_tiktok_product_id ON public.products (tiktok_product_id)
  WHERE tiktok_product_id IS NOT NULL;
CREATE INDEX idx_products_supplier_id ON public.products (supplier_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products (id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL,

  tiktok_order_id TEXT NOT NULL,
  tiktok_line_item_id TEXT,

  customer_shipping_address JSONB NOT NULL,

  supplier_order_id TEXT,
  tracking_number TEXT,
  tracking_carrier TEXT,

  fulfillment_status fulfillment_status NOT NULL DEFAULT 'pending',
  fulfillment_error TEXT,

  order_total NUMERIC(12, 2),
  supplier_cost NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'USD',

  tiktok_deadline_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  webhook_payload JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, tiktok_order_id)
);

-- Performance indexes (webhook idempotency + per-user order lists)
CREATE INDEX idx_orders_user_id ON public.orders (user_id);
CREATE INDEX idx_orders_tiktok_order_id ON public.orders (tiktok_order_id);
CREATE INDEX idx_orders_fulfillment_status ON public.orders (user_id, fulfillment_status);
CREATE INDEX idx_orders_pending_deadline ON public.orders (tiktok_deadline_at)
  WHERE fulfillment_status IN ('pending', 'routed_to_supplier', 'supplier_confirmed');

-- ---------------------------------------------------------------------------
-- Webhook event log (TikTok order notifications, idempotency)
-- ---------------------------------------------------------------------------
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'tiktok',
  event_type TEXT NOT NULL,
  external_event_id TEXT,
  payload JSONB NOT NULL,
  status webhook_event_status NOT NULL DEFAULT 'received',
  error_message TEXT,
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (source, external_event_id)
);

CREATE INDEX idx_webhook_events_status ON public.webhook_events (status, created_at);
CREATE INDEX idx_webhook_events_order_id ON public.webhook_events (order_id);

-- ---------------------------------------------------------------------------
-- Fulfillment attempt audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.fulfillment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  request_payload JSONB,
  response_payload JSONB,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fulfillment_attempts_order_id ON public.fulfillment_attempts (order_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER api_credentials_updated_at
  BEFORE UPDATE ON public.api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Vault credential helpers (service_role only — never expose to the browser)
-- ---------------------------------------------------------------------------

-- Store or rotate a credential. Called from Next.js API routes using service_role.
CREATE OR REPLACE FUNCTION public.store_api_credential(
  p_user_id UUID,
  p_provider credential_provider,
  p_lookup_key TEXT,
  p_secret TEXT,
  p_name TEXT DEFAULT NULL,
  p_key_hint TEXT DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_name TEXT;
  v_secret_id UUID;
  v_credential_id UUID;
  v_existing_vault_id UUID;
BEGIN
  IF p_secret IS NULL OR length(trim(p_secret)) = 0 THEN
    RAISE EXCEPTION 'secret must not be empty';
  END IF;

  v_vault_name := 'user:' || p_user_id::TEXT || ':' || p_lookup_key;

  SELECT vault_secret_id INTO v_existing_vault_id
  FROM public.api_credentials
  WHERE user_id = p_user_id AND lookup_key = p_lookup_key;

  IF v_existing_vault_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing_vault_id, p_secret, v_vault_name);
    UPDATE public.api_credentials
    SET
      name = COALESCE(p_name, name),
      key_hint = COALESCE(p_key_hint, key_hint),
      supplier_id = COALESCE(p_supplier_id, supplier_id),
      metadata = COALESCE(p_metadata, metadata),
      is_active = TRUE,
      updated_at = NOW()
  WHERE id = (
      SELECT id FROM public.api_credentials
      WHERE user_id = p_user_id AND lookup_key = p_lookup_key
    )
    RETURNING id INTO v_credential_id;
  ELSE
    v_secret_id := vault.create_secret(
      p_secret,
      v_vault_name,
      'credential:' || p_provider::TEXT
    );

    INSERT INTO public.api_credentials (
      user_id, supplier_id, provider, name, lookup_key,
      vault_secret_id, key_hint, metadata
    )
    VALUES (
      p_user_id,
      p_supplier_id,
      p_provider,
      COALESCE(p_name, p_lookup_key),
      p_lookup_key,
      v_secret_id,
      p_key_hint,
      p_metadata
    )
    RETURNING id INTO v_credential_id;
  END IF;

  RETURN v_credential_id;
END;
$$;

-- Decrypt a credential for server-side API calls (service_role only).
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

  RETURN v_plaintext;
END;
$$;

-- Soft-delete credential and remove Vault secret.
CREATE OR REPLACE FUNCTION public.revoke_api_credential(
  p_credential_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_vault_secret_id UUID;
BEGIN
  SELECT vault_secret_id INTO v_vault_secret_id
  FROM public.api_credentials
  WHERE id = p_credential_id AND user_id = p_user_id;

  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'credential not found';
  END IF;

  UPDATE public.api_credentials
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = p_credential_id;

  DELETE FROM vault.secrets WHERE id = v_vault_secret_id;
END;
$$;

-- Lock down Vault RPCs: only service_role (server-side) may call them.
REVOKE ALL ON FUNCTION public.store_api_credential FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_api_credential_secret FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_api_credential FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.store_api_credential TO service_role;
GRANT EXECUTE ON FUNCTION public.get_api_credential_secret TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_api_credential TO service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials FORCE ROW LEVEL SECURITY;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.fulfillment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_attempts FORCE ROW LEVEL SECURITY;

-- ---- users: full CRUD on own profile row ----------------------------------
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own"
  ON public.users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ---- products: full CRUD on own rows --------------------------------------
CREATE POLICY "products_select_own"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- orders: full CRUD on own rows ----------------------------------------
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_delete_own"
  ON public.orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- api_credentials: metadata visible; mutations via service_role RPC ------
CREATE POLICY "api_credentials_select_own"
  ON public.api_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated — use store_api_credential RPC.

-- ---- suppliers --------------------------------------------------------------
CREATE POLICY "suppliers_select_own"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "suppliers_insert_own"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "suppliers_update_own"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "suppliers_delete_own"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- webhook_events / fulfillment_attempts (read-only for tenants) ----------
CREATE POLICY "webhook_events_select_own"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "fulfillment_attempts_select_own"
  ON public.fulfillment_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = fulfillment_attempts.order_id
        AND o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Migration helpers (run ONLY when upgrading an existing database)
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.users
--   DROP COLUMN IF EXISTS tiktok_api_credentials,
--   DROP COLUMN IF EXISTS openai_api_key_encrypted,
--   DROP COLUMN IF EXISTS anthropic_api_key_encrypted,
--   DROP COLUMN IF EXISTS supplier_api_keys_encrypted;
--
-- ALTER TABLE public.suppliers
--   DROP COLUMN IF EXISTS api_credentials_encrypted;
--
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can manage own suppliers" ON public.suppliers;
-- DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
-- DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
-- DROP POLICY IF EXISTS "Users can view own webhook events" ON public.webhook_events;
-- DROP POLICY IF EXISTS "Users can view own fulfillment attempts" ON public.fulfillment_attempts;

-- ---------------------------------------------------------------------------
-- Storage: marketing images (optional — DALL-E URLs used as fallback)
-- ---------------------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;
