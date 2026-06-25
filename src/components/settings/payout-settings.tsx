"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CreditCard, ExternalLink, Loader2, Wallet } from "lucide-react";
import {
  disconnectPayoutAction,
  getPayoutStatusAction,
  openPayoutDashboardAction,
  refreshPayoutStatusAction,
  startPayoutConnectAction,
} from "@/app/(admin)/settings/payout-actions";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { PayoutAccountStatus } from "@/types/payout";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<PayoutAccountStatus["status"], string> = {
  not_connected: "Not connected",
  pending: "Setup incomplete",
  active: "Ready for payouts",
  restricted: "Action required",
};

function formatDestination(
  destination: PayoutAccountStatus["destination"]
): string {
  if (!destination) {
    return "No card or bank linked yet";
  }

  if (destination.type === "card") {
    const brand = destination.brand
      ? destination.brand.charAt(0).toUpperCase() + destination.brand.slice(1)
      : "Card";
    return `${brand} •••• ${destination.last4}`;
  }

  const bank = destination.bankName ?? "Bank account";
  return `${bank} •••• ${destination.last4}`;
}

export function PayoutSettings() {
  const [status, setStatus] = useState<PayoutAccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, startConnectTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isOpeningDashboard, startDashboardTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  const loadStatus = useCallback((options?: { refreshFromStripe?: boolean }) => {
    setIsLoading(true);
    setError(null);

    const action = options?.refreshFromStripe
      ? refreshPayoutStatusAction()
      : getPayoutStatusAction();

    void action.then((result) => {
      setIsLoading(false);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setStatus(result.data.status);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payoutParam = params.get("payout");

    if (payoutParam === "return" || payoutParam === "refresh") {
      loadStatus({ refreshFromStripe: true });

      params.delete("payout");
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
      return;
    }

    loadStatus();
  }, [loadStatus]);

  function handleConnect(): void {
    setError(null);
    setSuccessMessage(null);

    startConnectTransition(async () => {
      const result = await startPayoutConnectAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      window.location.href = result.data.url;
    });
  }

  function handleRefresh(): void {
    setError(null);
    setSuccessMessage(null);

    startRefreshTransition(async () => {
      const result = await refreshPayoutStatusAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setStatus(result.data.status);
      setSuccessMessage("Payout account status updated.");
    });
  }

  function handleOpenDashboard(): void {
    setError(null);
    setSuccessMessage(null);

    startDashboardTransition(async () => {
      const result = await openPayoutDashboardAction();

      if (!result.success) {
        setError(result.message);
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  }

  function handleDisconnect(): void {
    setError(null);
    setSuccessMessage(null);

    startDisconnectTransition(async () => {
      const result = await disconnectPayoutAction({ confirm: true });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccessMessage("Payout account disconnected.");
      loadStatus();
    });
  }

  const busy =
    isConnecting || isRefreshing || isOpeningDashboard || isDisconnecting;

  return (
    <div className="space-y-4">
      <div className="panel-padded">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wide">Profit payouts</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Connect a debit card or bank account so net profit from TikTok
              Shop orders can be deposited to you. TikTok pays your seller
              balance on their schedule — this links where your profits land.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payout settings…
          </div>
        ) : status ? (
          <div className="mt-6 space-y-4">
            {!status.stripeConfigured ? (
              <AlertBanner variant="info">
                Add <code className="text-xs">STRIPE_SECRET_KEY</code> to your
                server environment to enable secure card and bank connections.
                Until then, payout setup is disabled.
              </AlertBanner>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/20 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <p className="mt-1 font-medium">
                  {STATUS_LABELS[status.status]}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Payout destination
                </p>
                <p className="mt-1 flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {formatDestination(status.destination)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleConnect}
                disabled={busy || !status.stripeConfigured}
                className="btn-primary"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {status.connected ? "Update payout method" : "Connect card or bank"}
              </button>

              {status.connected ? (
                <>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={busy}
                    className="btn-secondary"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Refresh status
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenDashboard}
                    disabled={busy || status.status !== "active"}
                    className="btn-secondary"
                  >
                    {isOpeningDashboard ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Manage in Stripe
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={busy}
                    className={cn(
                      "text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-40"
                    )}
                  >
                    {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </>
              ) : null}
            </div>

            {status.payoutsEnabled ? (
              <p className="text-xs text-muted-foreground">
                Payouts are enabled. Net profit from fulfilled orders can be
                routed to your linked account.
              </p>
            ) : status.connected ? (
              <p className="text-xs text-muted-foreground">
                Finish Stripe onboarding to enable deposits to your card or bank.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <AlertBanner variant="success">{successMessage}</AlertBanner>
      ) : null}

      {error ? <AlertBanner variant="error">{error}</AlertBanner> : null}
    </div>
  );
}
