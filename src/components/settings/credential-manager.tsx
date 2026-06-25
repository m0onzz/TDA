"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getCredentialsAction,
  revokeCredentialAction,
  saveCredentialAction,
  testTikTokConnectionAction,
} from "@/app/(admin)/settings/actions";
import { UnauthorizedAlert } from "@/components/settings/unauthorized-alert";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { CredentialMetadata } from "@/lib/credentials/metadata";
import type { CredentialProvider } from "@/types/credentials";
import { CREDENTIAL_PROVIDER_LABELS } from "@/types/credentials";
import { cn } from "@/lib/utils";

const USER_MANAGED_PROVIDERS: CredentialProvider[] = [
  "tiktok_shop",
  "supplier",
  "custom",
];

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
  const [provider, setProvider] = useState<CredentialProvider>("tiktok_shop");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isTestingConnection, startTestTransition] = useTransition();

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
      setCredentials(result.data.credentials);
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
      setSuccessMessage("Credential saved securely to Vault.");
      loadCredentials();
    });
  }

  function handleTestConnection(): void {
    setError(null);
    setSuccessMessage(null);

    startTestTransition(async () => {
      const result = await testTikTokConnectionAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.data.ok) {
        setSuccessMessage(result.data.message);
      } else {
        setError(result.data.message);
      }
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
          TikTok Shop credentials
        </p>
        <p className="mt-2">
          Add your TikTok Shop access token to list products live. Without
          credentials, listing runs in simulation mode so you can test the full
          workflow locally. If listing fails after saving, revoke the credential
          and save it again.
        </p>
      </div>

      <form onSubmit={handleSave} className="panel-padded space-y-4">
        <div>
          <h2 className="text-sm uppercase tracking-wide">Add or rotate key</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            For live TikTok API calls, paste JSON with{" "}
            <code className="rounded border border-border bg-muted px-1">
              access_token
            </code>
            ,{" "}
            <code className="rounded border border-border bg-muted px-1">
              app_key
            </code>
            , and{" "}
            <code className="rounded border border-border bg-muted px-1">
              app_secret
            </code>
            . Optional:{" "}
            <code className="rounded border border-border bg-muted px-1">
              shop_cipher
            </code>
            . You can also set{" "}
            <code className="rounded border border-border bg-muted px-1">
              TIKTOK_APP_KEY
            </code>{" "}
            /{" "}
            <code className="rounded border border-border bg-muted px-1">
              TIKTOK_APP_SECRET
            </code>{" "}
            on the server.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
{`{
  "access_token": "your_token",
  "app_key": "your_app_key",
  "app_secret": "your_app_secret",
  "shop_cipher": "optional_shop_cipher"
}`}
          </pre>
        </div>

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

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving || !secret.trim()}
            className="btn-primary"
          >
            {isSaving ? "Saving…" : "Save securely"}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection || isSaving}
            className="btn-secondary"
          >
            {isTestingConnection ? "Testing…" : "Test TikTok connection"}
          </button>
        </div>
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
            No credentials saved yet.
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
