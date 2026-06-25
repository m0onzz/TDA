export type PayoutConnectionStatus =
  | "not_connected"
  | "pending"
  | "active"
  | "restricted";

export interface PayoutDestinationSummary {
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  bankName?: string;
}

export interface StoredPayoutSettings {
  stripeAccountId?: string;
  status: PayoutConnectionStatus;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  destination?: PayoutDestinationSummary | null;
  updatedAt?: string;
}

export interface PayoutAccountStatus {
  /** Stripe Connect is configured on the server (STRIPE_SECRET_KEY). */
  stripeConfigured: boolean;
  connected: boolean;
  status: PayoutConnectionStatus;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  destination: PayoutDestinationSummary | null;
  stripeAccountId: string | null;
}
