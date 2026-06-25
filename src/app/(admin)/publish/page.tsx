import { AdminHeader } from "@/components/layout/admin-header";
import { PublishCenter } from "@/components/publish/publish-center";

export default function PublishPage() {
  return (
    <>
      <AdminHeader
        title="Listings"
        description="Select ready products and list them on TikTok Shop."
      />
      <PublishCenter />
    </>
  );
}
