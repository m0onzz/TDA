"use server";

import { z } from "zod";
import { formatAuthActionError } from "@/lib/auth/errors";
import {
  createConfirmedUser,
  signInAndEstablishSession,
} from "@/lib/auth/signup";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuthActionResult } from "@/types/auth";

const authInputSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});

function resolveRedirectPath(redirectTo?: string): string {
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/dashboard";
}

export async function signInAction(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<AuthActionResult> {
  const parsed = authInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const result = await signInAndEstablishSession(
      parsed.data.email,
      parsed.data.password
    );

    if (!result.success) {
      return { success: false, message: result.message ?? "Sign in failed" };
    }

    return {
      success: true,
      redirectTo: resolveRedirectPath(input.redirectTo),
    };
  } catch (error) {
    return {
      success: false,
      message: formatAuthActionError(error),
    };
  }
}

export async function signUpAction(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<AuthActionResult> {
  const parsed = authInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const result = await createConfirmedUser(
      parsed.data.email,
      parsed.data.password
    );

    if (!result.success) {
      return { success: false, message: result.message ?? "Sign up failed" };
    }

    return {
      success: true,
      redirectTo: resolveRedirectPath(input.redirectTo),
    };
  } catch (error) {
    return {
      success: false,
      message: formatAuthActionError(error),
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
}
