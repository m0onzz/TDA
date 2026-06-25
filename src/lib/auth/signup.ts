import { mapSupabaseAuthError } from "@/lib/auth/errors";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface SignInWithSessionResult {
  success: boolean;
  message?: string;
}

function isEmailNotConfirmedError(message: string): boolean {
  return message.toLowerCase().includes("email not confirmed");
}

function isAlreadyRegisteredError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already registered")
  );
}

async function confirmUserByEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    throw new Error(`Failed to look up user: ${error.message}`);
  }

  const user = data.users.find(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return false;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    throw new Error(`Failed to confirm user: ${updateError.message}`);
  }

  return true;
}

/**
 * Signs the user in and sets SSR auth cookies.
 * If Supabase still requires email confirmation, auto-confirms server-side first.
 */
export async function signInAndEstablishSession(
  email: string,
  password: string
): Promise<SignInWithSessionResult> {
  const supabase = createServerSupabaseClient();

  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error && isEmailNotConfirmedError(error.message)) {
    const confirmed = await confirmUserByEmail(email);

    if (confirmed) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      error = retry.error;
    }
  }

  if (error) {
    return {
      success: false,
      message: mapSupabaseAuthError(error.message),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await ensureUserProfile(user.id);
  }

  return { success: true };
}

/**
 * Creates a user with email already confirmed — no inbox verification step.
 */
export async function createConfirmedUser(
  email: string,
  password: string
): Promise<SignInWithSessionResult> {
  const admin = createAdminClient();

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (isAlreadyRegisteredError(createError.message)) {
      return signInAndEstablishSession(email, password);
    }

    return {
      success: false,
      message: mapSupabaseAuthError(createError.message),
    };
  }

  return signInAndEstablishSession(email, password);
}
