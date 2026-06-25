import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedAlert() {
  return (
    <div role="alert" className="alert-error px-6 py-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
        <div>
          <h2 className="text-sm uppercase tracking-wide">Unauthorized</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your session has expired or you are not signed in. Sign in again to
            manage API credentials.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm underline underline-offset-2 hover:opacity-70"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
