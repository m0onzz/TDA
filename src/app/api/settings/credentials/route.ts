import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  listCredentialMetadata,
  revokeCredential,
  revokeCredentialSchema,
  storeCredential,
  storeCredentialSchema,
} from "@/lib/services/credential-service";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const credentials = await listCredentialMetadata(user.id);
    return NextResponse.json(apiSuccess({ credentials }));
  } catch (error) {
    console.error("[GET /api/settings/credentials]", error);
    return NextResponse.json(
      apiError("Failed to load credentials", "CREDENTIALS_LIST_FAILED"),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body: unknown = await request.json();
    const parsed = storeCredentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const credentialId = await storeCredential(user.id, parsed.data);

    return NextResponse.json(
      apiSuccess({ id: credentialId, message: "Credential stored securely" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/settings/credentials]", error);
    return NextResponse.json(
      apiError("Failed to store credential", "CREDENTIAL_STORE_FAILED"),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(apiError("Unauthorized", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body: unknown = await request.json();
    const parsed = revokeCredentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError(parsed.error.issues[0]?.message ?? "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    await revokeCredential(user.id, parsed.data.id);

    return NextResponse.json(
      apiSuccess({ message: "Credential revoked" })
    );
  } catch (error) {
    console.error("[DELETE /api/settings/credentials]", error);
    return NextResponse.json(
      apiError("Failed to revoke credential", "CREDENTIAL_REVOKE_FAILED"),
      { status: 500 }
    );
  }
}
