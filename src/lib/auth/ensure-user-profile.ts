import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ensures a row exists in public.users for the authenticated auth.users id.
 * Required before inserts into products/orders (FK on user_id).
 *
 * Handles accounts created before the on_auth_user_created trigger was installed.
 */
export async function ensureUserProfile(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to look up user profile: ${lookupError.message}`);
  }

  if (existing?.id) {
    return;
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(userId);

  if (authError || !authData.user?.email) {
    throw new Error("Could not resolve auth user for profile creation");
  }

  const { error: insertError } = await admin.from("users").insert({
    id: userId,
    email: authData.user.email,
  });

  if (insertError && !insertError.message.includes("duplicate")) {
    throw new Error(`Failed to create user profile: ${insertError.message}`);
  }
}
