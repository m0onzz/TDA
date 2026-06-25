"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getCredentialsAction,
  revokeCredentialAction,
  saveCredentialAction,
} from "@/app/(admin)/settings/actions";
import { UnauthorizedAlert } from "@/components/settings/unauthorized-alert";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { CredentialMetadata } from "@/lib/credentials/metadata";
import type { CredentialProvider } from "@/types/credentials";
import { CREDENTIAL_PROVIDER_LABELS } from "@/types/credentials";
import { cn } from "@/lib/utils";

const USER_MANAGED_PROVIDERS: CredentialProvider[] = ["supplier", "custom"];

type AuthState = "loading" | "authenticated" | "unauthorized";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function CredentialManager() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [provider, setProvider] = useState<CredentialProvider>("supplier");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();

  const loadCredentials = useCallback(() => {
    startRefreshTransition(async () => {
      setError(null);

      const result = await getCredentialsAction();

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
          setCredentials([]);
          return;
        }

        setAuthState("authenticated");
        setError(result.message);
        return;
      }

      setAuthState("authenticated");
      setCredentials(
        result.data.credentials.filter(
          (credential) => credential.provider !== "tiktok_shop"
        )
      );
    });
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startSaveTransition(async () => {
      const result = await saveCredentialAction({ provider, secret });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
        }
        setError(result.message);
        return;
      }

      setSecret("");
      setSuccessMessage("Credential saved securely.");
      loadCredentials();
    });
  }

  async function handleRevoke(id: string) {
    setError(null);
    setSuccessMessage(null);
    setRevokingId(id);

    const result = await revokeCredentialAction({ id });

    setRevokingId(null);

    if (!result.success) {
      if (result.code === "UNAUTHORIZED") {
        setAuthState("unauthorized");
      }
      setError(result.message);
      return;
    }

    setSuccessMessage("Credential revoked.");
    loadCredentials();
  }

  if (authState === "loading" || (isRefreshing && credentials.length === 0)) {
    return (
      <div className="panel-padded text-sm text-muted-foreground">
        Loading credentials…
      </div>
    );
  }

  if (authState === "unauthorized") {
    return <UnauthorizedAlert />;
  }

  return (
    <div className="space-y-6">
      <div className="panel-padded text-sm text-muted-foreground">
        <p className="text-xs uppercase tracking-wide text-foreground">
          Other API credentials
        </p>
        <p className="mt-2">
          Store supplier or custom integration keys. TikTok Shop uses the
          dedicated section above.
        </p>
      </div>

      <form onSubmit={handleSave} className="panel-padded space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Provider
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as CredentialProvider)}
              disabled={isSaving}
              className="input-field"
            >
              {USER_MANAGED_PROVIDERS.map((value) => (
                <option key={value} value={value}>
                  {CREDENTIAL_PROVIDER_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              API key / token
            </span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Paste your secret here"
              required
              disabled={isSaving}
              autoComplete="off"
              className="input-field"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving || !secret.trim()}
          className="btn-primary"
        >
          {isSaving ? "Saving…" : "Save securely"}
        </button>
      </form>

      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}

      <div className="panel overflow-hidden">
        <div className="panel-section">
          <h2 className="text-sm uppercase tracking-wide">Stored credentials</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Metadata only — masked keys, never decrypted secrets.
          </p>
        </div>

        {isRefreshing && credentials.length > 0 ? (
          <p className="px-6 py-3 text-xs text-muted-foreground">Refreshing…</p>
        ) : null}

        {credentials.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No supplier or custom credentials saved yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p>{credential.providerName}</p>
                  <p className="text-sm text-muted-foreground tracking-tight">
                    {credential.maskedKey}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Added {formatDate(credential.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevoke(credential.id)}
                  disabled={revokingId === credential.id || isSaving}
                  className={cn(
                    "text-sm underline underline-offset-2 hover:opacity-70 disabled:opacity-40"
                  )}
                >
                  {revokingId === credential.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
