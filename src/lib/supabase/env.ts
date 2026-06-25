const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "your-publishable-key",
  "xxxxxxxx",
  "example.com",
] as const;

function isPlaceholderValue(value: string): boolean {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (isPlaceholderValue(value)) {
    throw new Error(
      `${name} is still set to a placeholder value. Copy .env.local.example to .env.local and paste your real Supabase credentials from Project Settings → API.`
    );
  }
  return value;
}

function assertValidSupabaseUrl(url: string): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. It should look like https://abcdefghijklmnop.supabase.co"
    );
  }

  if (!parsed.hostname.endsWith(".supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be your Supabase project URL (*.supabase.co)."
    );
  }

  // Base project URL only — not /rest/v1 or other API paths
  return `https://${parsed.hostname}`;
}

function assertValidSupabaseClientKey(key: string, envName: string): string {
  const isLegacyJwt = key.startsWith("eyJ");
  const isPublishable = key.startsWith("sb_publishable_");
  const isSecret = key.startsWith("sb_secret_");

  if (envName.includes("ANON") || envName.includes("PUBLISHABLE")) {
    if (!isLegacyJwt && !isPublishable) {
      throw new Error(
        `${envName} must be your publishable/anon key (sb_publishable_... or eyJ...).`
      );
    }
    return key;
  }

  if (!isLegacyJwt && !isSecret) {
    throw new Error(
      `${envName} must be your secret/service_role key (sb_secret_... or eyJ...).`
    );
  }

  return key;
}

export function getSupabaseUrl(): string {
  return assertValidSupabaseUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
}

export function getSupabaseAnonKey(): string {
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return assertValidSupabaseClientKey(key, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey(): string {
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return assertValidSupabaseClientKey(key, "SUPABASE_SERVICE_ROLE_KEY");
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
