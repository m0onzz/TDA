import type { ApiCredential, CredentialProvider } from "@/types/credentials";
import { CREDENTIAL_PROVIDER_LABELS } from "@/types/credentials";

const PROVIDER_MASK_PREFIX: Record<CredentialProvider, string> = {
  tiktok_shop: "tt_shop_",
  openai: "openai_",
  anthropic: "anthropic_",
  supplier: "supplier_",
  custom: "custom_",
};

export function formatMaskedCredentialKey(
  provider: CredentialProvider,
  keyHint: string | null
): string {
  const prefix = PROVIDER_MASK_PREFIX[provider];
  const suffix = keyHint?.replace(/^\.\.\./, "") ?? "****";
  return `${prefix}${"•".repeat(8)}${suffix}`;
}

export interface CredentialMetadata {
  id: string;
  provider: CredentialProvider;
  providerName: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

export function toCredentialMetadata(
  credential: ApiCredential
): CredentialMetadata {
  return {
    id: credential.id,
    provider: credential.provider,
    providerName: CREDENTIAL_PROVIDER_LABELS[credential.provider],
    name: credential.name,
    maskedKey: formatMaskedCredentialKey(
      credential.provider,
      credential.key_hint
    ),
    createdAt: credential.created_at,
    updatedAt: credential.updated_at,
  };
}
