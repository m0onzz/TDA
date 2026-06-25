"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, Loader2, Send, Trash2 } from "lucide-react";
import {
  getDiscordWebhookStatusAction,
  removeDiscordWebhookAction,
  saveDiscordWebhookAction,
  testDiscordWebhookAction,
} from "@/app/(admin)/settings/discord-actions";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { DiscordWebhookStatus } from "@/lib/services/discord-notification-service";

export function DiscordWebhookSettings() {
  const [status, setStatus] = useState<DiscordWebhookStatus>({
    configured: false,
    credentialId: null,
    maskedKey: null,
  });
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();

  const loadStatus = useCallback(() => {
    setIsLoading(true);
    setError(null);

    void getDiscordWebhookStatusAction().then((result) => {
      setIsLoading(false);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setStatus(result.data.status);
    });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleSave(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startSaveTransition(async () => {
      const result = await saveDiscordWebhookAction({ webhookUrl });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setWebhookUrl("");
      setSuccessMessage("Discord webhook saved. New orders will post to your channel.");
      loadStatus();
    });
  }

  function handleRemove(): void {
    setError(null);
    setSuccessMessage(null);

    startRemoveTransition(async () => {
      const result = await removeDiscordWebhookAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccessMessage("Discord webhook removed.");
      loadStatus();
    });
  }

  function handleTest(): void {
    setError(null);
    setSuccessMessage(null);

    startTestTransition(async () => {
      const result = await testDiscordWebhookAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccessMessage("Example order notification sent to Discord.");
    });
  }

  return (
    <div className="panel-padded space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <Bell className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Notifications
          </p>
          <h2 className="mt-1 text-lg font-bold">Discord order alerts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a Discord channel webhook URL to get notified when TikTok Shop
            orders are placed — including the item sold and estimated profit.
            The URL is encrypted and stored securely.
          </p>
        </div>
      </div>

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      {status.configured ? (
        <div className="space-y-4 border-t border-border pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">Webhook connected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hint: {status.maskedKey ?? "••••••••"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || isLoading}
                className="btn-secondary"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                Send test
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving || isLoading}
                className="btn-secondary"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Remove
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <label className="block space-y-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Replace webhook URL
              </span>
              <input
                type="url"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="input-field"
                disabled={isSaving || isLoading}
              />
            </label>
            <button
              type="submit"
              disabled={isSaving || isLoading || !webhookUrl.trim()}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Update webhook"
              )}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 border-t border-border pt-5">
          <label className="block space-y-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Discord webhook URL
            </span>
            <input
              type="url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="input-field"
              disabled={isSaving || isLoading}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            In Discord: channel settings → Integrations → Webhooks → New webhook →
            copy URL.
          </p>
          <button
            type="submit"
            disabled={isSaving || isLoading || !webhookUrl.trim()}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save webhook"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
