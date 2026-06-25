import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
