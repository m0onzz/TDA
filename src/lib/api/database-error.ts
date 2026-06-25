import { NextResponse } from "next/server";

const SCHEMA_SETUP_HINT =
  "Database not set up. Run schema.sql in your Supabase SQL Editor to create the products table.";

export function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("relation") && normalized.includes("does not exist")
  );
}

export function formatDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Database error";

  if (isMissingTableError(message)) {
    return SCHEMA_SETUP_HINT;
  }

  return message;
}

export function databaseErrorResponse(error: unknown, code: string) {
  const rawMessage = error instanceof Error ? error.message : "Database error";
  const message = formatDatabaseError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status: isMissingTableError(rawMessage) ? 503 : 500 }
  );
}
