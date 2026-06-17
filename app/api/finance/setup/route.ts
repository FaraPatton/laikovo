import { NextResponse } from "next/server";
import { ensureOperationsSheet } from "@/app/lib/google-sheets";
import { isPinAuthorized } from "@/app/lib/pin-auth";

export async function POST() {
  if (!(await isPinAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
