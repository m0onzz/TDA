import { AdminHeader } from "@/components/layout/admin-header";
import { CredentialManager } from "@/components/settings/credential-manager";
import { DiscordWebhookSettings } from "@/components/settings/discord-webhook-settings";
import { ExperienceSettings } from "@/components/settings/experience-settings";
import { PayoutSettings } from "@/components/settings/payout-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";

export default function SettingsPage() {
  return (
    <>
      <AdminHeader
        title="Settings"
        description="Payouts, notifications, appearance, TikTok Shop credentials, and feedback."
      />
      <div className="page-content space-y-6">
        <PayoutSettings />
        <ThemeSettings />
        <DiscordWebhookSettings />
        <ExperienceSettings />
        <CredentialManager />
      </div>
    </>
  );
}
