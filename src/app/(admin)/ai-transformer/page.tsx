import { AdminHeader } from "@/components/layout/admin-header";
import { AiTransformer } from "@/components/ai-transformer/ai-transformer";

export default function AiTransformerPage() {
  return (
    <>
      <AdminHeader
        title="Price Optimizer"
        description="Set markup, preview net profit after TikTok fees, and auto-optimize pricing across your catalog."
      />
      <AiTransformer />
    </>
  );
}
