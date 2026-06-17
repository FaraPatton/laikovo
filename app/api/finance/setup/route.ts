import { NextResponse } from "next/server";
import { ensureOperationsSheet } from "@/app/lib/google-sheets";

export async function POST() {
  try {
    await ensureOperationsSheet();
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
