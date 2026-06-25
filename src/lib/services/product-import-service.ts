import { z } from "zod";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { ImportProductPayload } from "@/types/product-discovery";

const importProductSchema = z.object({
  originalSupplierUrl: z.string().url(),
  rawData: z.record(z.string(), z.unknown()),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
});

export async function importDiscoveredProduct(
  userId: string,
  payload: ImportProductPayload
): Promise<string> {
  const parsed = importProductSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product payload");
  }

  if (parsed.data.sellingPrice < parsed.data.costPrice) {
    throw new Error("Selling price must be greater than or equal to cost price");
  }

  await ensureUserProfile(userId);

  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .eq("original_supplier_url", parsed.data.originalSupplierUrl)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("products")
      .update({
        raw_data: parsed.data.rawData as Json,
        cost_price: parsed.data.costPrice,
        selling_price: parsed.data.sellingPrice,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`Failed to refresh product listing: ${updateError.message}`);
    }

    return existing.id;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      original_supplier_url: parsed.data.originalSupplierUrl,
      raw_data: parsed.data.rawData as Json,
      cost_price: parsed.data.costPrice,
      selling_price: parsed.data.sellingPrice,
      currency: "USD",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to import product: ${error.message}`);
  }

  return data.id;
}
