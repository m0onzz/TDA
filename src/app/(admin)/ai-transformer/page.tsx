import { AdminHeader } from "@/components/layout/admin-header";
import { AiTransformer } from "@/components/ai-transformer/ai-transformer";

export default function AiTransformerPage() {
  return (
    <>
      <AdminHeader title="Price Optimizer" />
      <AiTransformer />
    </>
  );
}
