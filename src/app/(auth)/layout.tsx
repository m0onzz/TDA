export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Admin Access
          </p>
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground">
            &larr; Back to TDA
          </a>
        </p>
      </div>
    </div>
  );
}
