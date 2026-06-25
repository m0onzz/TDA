const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid login credentials. Check your email and password.",
  email_not_confirmed:
    "Email not confirmed. Check your inbox for the confirmation link.",
  user_already_registered: "Email already registered. Try signing in instead.",
  signup_disabled: "Sign up is currently disabled. Contact support.",
};

export function mapSupabaseAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return AUTH_ERROR_MESSAGES.invalid_credentials;
  }

  if (normalized.includes("email not confirmed")) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed;
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered")
  ) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }

  return message;
}

export function formatAuthActionError(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("placeholder") ||
      error.message.includes("NEXT_PUBLIC_SUPABASE")
    ) {
      return error.message;
    }

    const cause = error.cause;
    if (
      cause instanceof Error &&
      (cause.message.includes("ENOTFOUND") ||
        cause.message.includes("your-project.supabase.co"))
    ) {
      return "Supabase is not configured. Update .env.local with your real project URL from supabase.com → Project Settings → API (replace your-project.supabase.co).";
    }

    if (error.message.toLowerCase().includes("fetch failed")) {
      return "Unable to reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local — it must be your real *.supabase.co project URL, not the placeholder.";
    }

    return mapSupabaseAuthError(error.message);
  }

  return "An unexpected error occurred. Please try again.";
}
