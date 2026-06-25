"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  getTikTokSetupStatusAction,
  revokeCredentialAction,
  saveTikTokShopCredentialAction,
  saveTikTokShopJsonCredentialAction,
  testTikTokConnectionAction,
  type TikTokSetupStatus,
} from "@/app/(admin)/settings/actions";
import { UnauthorizedAlert } from "@/components/settings/unauthorized-alert";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  TIKTOK_APP_CREDENTIALS_DOC_URL,
  TIKTOK_PARTNER_CENTER_URL,
} from "@/lib/tiktok/credential-format";
import { cn } from "@/lib/utils";

type AuthState = "loading" | "authenticated" | "unauthorized";

function FieldLabel({
  children,
  hint,
  optional,
}: {
  children: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <span className="block space-y-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {children}
        {optional ? (
          <span className="ml-1 normal-case text-muted-foreground/80">
            (optional)
          </span>
        ) : null}
      </span>
      {hint ? (
        <span className="block text-xs font-normal normal-case text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

export function TikTokShopSettings() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [status, setStatus] = useState<TikTokSetupStatus | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [shopCipher, setShopCipher] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isSavingJson, startSaveJsonTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [isRevoking, startRevokeTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();

  const loadStatus = useCallback(() => {
    startRefreshTransition(async () => {
      setError(null);

      const result = await getTikTokSetupStatusAction();

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
          setStatus(null);
          return;
        }

        setAuthState("authenticated");
        setError(result.message);
        return;
      }

      setAuthState("authenticated");
      setStatus(result.data);
    });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const serverHasAppCreds = status?.serverEnv.hasAppCredentials ?? false;
  const serverHasPartialAppCreds =
    Boolean(status?.serverEnv.hasAppKey) !==
    Boolean(status?.serverEnv.hasAppSecret);
  const needsAppKey = !serverHasAppCreds && !status?.serverEnv.hasAppKey;
  const needsAppSecret = !serverHasAppCreds && !status?.serverEnv.hasAppSecret;

  function clearForm(): void {
    setAccessToken("");
    setAppKey("");
    setAppSecret("");
    setShopCipher("");
    setRawJson("");
  }

  function handleQuickSave(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startSaveTransition(async () => {
      const result = await saveTikTokShopCredentialAction({
        accessToken,
        appKey: appKey || undefined,
        appSecret: appSecret || undefined,
        shopCipher: shopCipher || undefined,
      });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
        }
        setError(result.message);
        return;
      }

      clearForm();
      setSuccessMessage("TikTok Shop credentials saved securely.");
      loadStatus();
    });
  }

  function handleJsonSave(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startSaveJsonTransition(async () => {
      const result = await saveTikTokShopJsonCredentialAction({ rawJson });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
        }
        setError(result.message);
        return;
      }

      clearForm();
      setSuccessMessage("TikTok Shop credentials saved securely.");
      loadStatus();
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

  function handleRevoke(): void {
    const credentialId = status?.storedCredential.credentialId;
    if (!credentialId) return;

    setError(null);
    setSuccessMessage(null);

    startRevokeTransition(async () => {
      const result = await revokeCredentialAction({ id: credentialId });

      if (!result.success) {
        if (result.code === "UNAUTHORIZED") {
          setAuthState("unauthorized");
        }
        setError(result.message);
        return;
      }

      setSuccessMessage("TikTok Shop credentials removed.");
      loadStatus();
    });
  }

  if (authState === "loading" || (isRefreshing && !status)) {
    return (
      <div className="panel-padded text-sm text-muted-foreground">
        Loading TikTok Shop setup…
      </div>
    );
  }

  if (authState === "unauthorized") {
    return <UnauthorizedAlert />;
  }

  return (
    <div className="panel-padded space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <ShoppingBag className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            TikTok Shop API
          </p>
          <h2 className="mt-1 text-lg font-bold">Connect your TikTok Shop</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            List products live on TikTok Shop. Without credentials, publishing
            runs in simulation mode so you can test the workflow locally.
          </p>
        </div>
      </div>

      {status?.serverEnv.simulatePublish ? (
        <AlertBanner variant="error">
          This server has simulation mode enabled (TIKTOK_SHOP_SIMULATE_PUBLISH).
          Product listing will not call the live TikTok API until that is turned
          off.
        </AlertBanner>
      ) : null}

      {serverHasAppCreds ? (
        <AlertBanner variant="success">
          App Key and App Secret are configured on the server. You only need to
          paste your shop access token below.
        </AlertBanner>
      ) : serverHasPartialAppCreds ? (
        <AlertBanner variant="error">
          Only part of the server app credentials are set (
          {status?.serverEnv.hasAppKey ? "App Key yes" : "App Key missing"},{" "}
          {status?.serverEnv.hasAppSecret ? "App Secret yes" : "App Secret missing"}
          ). Fill in the missing field below or set both TIKTOK_APP_KEY and
          TIKTOK_APP_SECRET on the server.
        </AlertBanner>
      ) : null}

      {status?.storedCredential.configured ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Credentials saved</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hint: {status.storedCredential.maskedKey ?? "••••••••"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="btn-secondary"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {isTesting ? "Testing…" : "Test connection"}
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isRevoking || isSaving}
              className="btn-secondary"
            >
              {isRevoking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      <div className="space-y-3 border-t border-border pt-5">
        <h3 className="text-sm font-bold">How to get your credentials</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Open{" "}
            <a
              href={TIKTOK_PARTNER_CENTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline underline-offset-2 hover:opacity-80"
            >
              TikTok Shop Partner Center
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>{" "}
            and create or select your seller app.
          </li>
          <li>
            Copy your{" "}
            <a
              href={TIKTOK_APP_CREDENTIALS_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline underline-offset-2 hover:opacity-80"
            >
              App Key and App Secret
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            {serverHasAppCreds
              ? " (already on this server — skip if you only manage tokens here)."
              : "."}
          </li>
          <li>
            Authorize your shop with the app and copy the{" "}
            <strong className="font-medium text-foreground">access token</strong>{" "}
            TikTok provides after authorization.
          </li>
          <li>Paste the values in Quick setup, save, then click Test connection.</li>
        </ol>
      </div>

      <form onSubmit={handleQuickSave} className="space-y-4 border-t border-border pt-5">
        <div>
          <h3 className="text-sm font-bold">Quick setup</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in each field separately — no JSON required.
          </p>
        </div>

        <label className="block space-y-2 text-sm">
          <FieldLabel hint="From Partner Center after you authorize your shop.">
            Access token
          </FieldLabel>
          <input
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="Paste your shop access token"
            autoComplete="off"
            disabled={isSaving}
            className="input-field"
            required
          />
        </label>

        {needsAppKey ? (
          <label className="block space-y-2 text-sm">
            <FieldLabel hint="Listed as App Key in Partner Center → your app → credentials.">
              App key
            </FieldLabel>
            <input
              type="password"
              value={appKey}
              onChange={(event) => setAppKey(event.target.value)}
              placeholder="Your TikTok app key"
              autoComplete="off"
              disabled={isSaving}
              className="input-field"
              required={needsAppKey}
            />
          </label>
        ) : null}

        {needsAppSecret ? (
          <label className="block space-y-2 text-sm">
            <FieldLabel hint="Listed as App Secret in Partner Center. Keep this private.">
              App secret
            </FieldLabel>
            <input
              type="password"
              value={appSecret}
              onChange={(event) => setAppSecret(event.target.value)}
              placeholder="Your TikTok app secret"
              autoComplete="off"
              disabled={isSaving}
              className="input-field"
              required={needsAppSecret}
            />
          </label>
        ) : null}

        <label className="block space-y-2 text-sm">
          <FieldLabel
            optional
            hint="Leave blank to auto-detect your shop on first API call."
          >
            Shop cipher
          </FieldLabel>
          <input
            type="password"
            value={shopCipher}
            onChange={(event) => setShopCipher(event.target.value)}
            placeholder="Only if TikTok gave you a shop cipher"
            autoComplete="off"
            disabled={isSaving}
            className="input-field"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving || !accessToken.trim()}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save credentials"
            )}
          </button>
          {!status?.storedCredential.configured ? (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="btn-secondary"
            >
              {isTesting ? "Testing…" : "Test connection"}
            </button>
          ) : null}
        </div>
      </form>

      <div className="border-t border-border pt-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold"
          aria-expanded={advancedOpen}
        >
          Advanced setup (JSON)
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              advancedOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {advancedOpen ? (
          <form onSubmit={handleJsonSave} className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste credential JSON if you already have it from another tool.
              Values are validated and encrypted on the server.
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
{`{
  "access_token": "your_token",
  "app_key": "your_app_key",
  "app_secret": "your_app_secret",
  "shop_cipher": "optional"
}`}
            </pre>
            <textarea
              value={rawJson}
              onChange={(event) => setRawJson(event.target.value)}
              rows={5}
              placeholder='{"access_token":"..."}'
              disabled={isSavingJson}
              className="input-field font-mono text-xs"
            />
            <button
              type="submit"
              disabled={isSavingJson || !rawJson.trim()}
              className="btn-secondary"
            >
              {isSavingJson ? "Saving…" : "Save from JSON"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
