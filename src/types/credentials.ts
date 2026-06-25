export type CredentialProvider =
  | "tiktok_shop"
  | "openai"
  | "anthropic"
  | "supplier"
  | "custom";

export interface ApiCredential {
  id: string;
  user_id: string;
  supplier_id: string | null;
  provider: CredentialProvider;
  name: string;
  lookup_key: string;
  key_hint: string | null;
  expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StoreCredentialInput {
  provider: CredentialProvider;
  lookupKey: string;
  secret: string;
  name?: string;
  supplierId?: string;
  metadata?: Record<string, unknown>;
}

export const CREDENTIAL_PROVIDER_LABELS: Record<CredentialProvider, string> = {
  tiktok_shop: "TikTok Shop",
  openai: "OpenAI",
  anthropic: "Anthropic",
  supplier: "Supplier",
  custom: "Custom",
};
