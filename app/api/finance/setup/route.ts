import { NextResponse } from "next/server";
import { requireAuthedSession } from "@/app/lib/auth-guard";
import { ensureOperationsSheet } from "@/app/lib/google-sheets";

export async function POST() {
  const session = await requireAuthedSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureOperationsSheet(session.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare operations sheet.",
      },
      { status: 500 },
    );
  }
}
