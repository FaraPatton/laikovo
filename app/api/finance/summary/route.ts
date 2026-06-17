import { NextResponse } from "next/server";
import { readExpenses, summarizeExpenses } from "@/app/lib/google-sheets";
import { isPinAuthorized } from "@/app/lib/pin-auth";

export async function GET() {
  if (!(await isPinAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await readExpenses();
    return NextResponse.json(summarizeExpenses(expenses));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to read finance summary.",
      },
      { status: 500 },
    );
  }
}
