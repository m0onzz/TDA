interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 px-6 py-5 md:px-8">
      <h1 className="text-2xl uppercase tracking-wide">{title}</h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
