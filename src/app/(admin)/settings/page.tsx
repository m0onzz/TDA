import { AdminHeader } from "@/components/layout/admin-header";
import { CredentialManager } from "@/components/settings/credential-manager";

export default function SettingsPage() {
  return (
    <>
      <AdminHeader
        title="Settings"
        description="TikTok Shop and supplier credentials."
      />
      <div className="page-content">
        <CredentialManager />
      </div>
    </>
  );
}
