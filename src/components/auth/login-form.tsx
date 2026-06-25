"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  signInAction,
  signUpAction,
} from "@/app/(auth)/login/actions";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useFeedback } from "@/components/providers/feedback-provider";
import type { AuthMode } from "@/types/auth";
import { cn } from "@/lib/utils";

const AUTH_TABS: { mode: AuthMode; label: string }[] = [
  { mode: "signin", label: "Sign in" },
  { mode: "signup", label: "Create account" },
];

function getInitialMode(searchParams: URLSearchParams): AuthMode {
  return searchParams.get("mode") === "signup" ? "signup" : "signin";
}

function getInitialError(searchParams: URLSearchParams): string | null {
  if (searchParams.get("error") === "auth_callback_failed") {
    return "Email confirmation failed. Please try signing in again.";
  }
  return null;
}

export function LoginForm() {
  const { feedback } = useFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    getInitialError(searchParams)
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModeChange = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const clearForm = useCallback(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleRedirect = useCallback(
    (path: string) => {
      clearForm();
      router.push(path);
      router.refresh();
    },
    [clearForm, router]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload = { email, password, redirectTo };

      const result =
        mode === "signin"
          ? await signInAction(payload)
          : await signUpAction(payload);

      if (!result.success) {
        setError(result.message);
        feedback("error", "error");
        return;
      }

      feedback("success", "success");
      handleRedirect(result.redirectTo);
    } catch {
      setError(
        "Unable to complete authentication. Check your connection and try again."
      );
      feedback("error", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel =
    mode === "signin" ? "Sign in" : "Create account";

  return (
    <div className="panel border-2 border-foreground p-8 shadow-[4px_4px_0_0_hsl(0_0%_100%)]">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-foreground bg-foreground text-background">
          <Sparkles className="h-6 w-6" strokeWidth={2} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">TDA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage products, credentials, and fulfillment.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-1">
        {AUTH_TABS.map(({ mode: tabMode, label }) => (
          <button
            key={tabMode}
            type="button"
            onClick={() => handleModeChange(tabMode)}
            disabled={isSubmitting}
            aria-pressed={mode === tabMode}
            className={cn(
              "rounded px-3 py-2 text-sm transition-colors disabled:opacity-40",
              mode === tabMode
                ? "border border-foreground bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <label className="block space-y-2 text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isSubmitting}
            className="input-field"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Password
          </span>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            disabled={isSubmitting}
            className="input-field"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !password}
          className="btn-primary w-full py-2.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      {successMessage ? (
        <AlertBanner variant="success" className="mt-4">
          {successMessage}
        </AlertBanner>
      ) : null}

      {error ? (
        <AlertBanner variant="error" className="mt-4">
          {error}
        </AlertBanner>
      ) : null}
    </div>
  );
}
