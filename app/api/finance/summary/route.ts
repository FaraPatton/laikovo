import { NextResponse } from "next/server";
import { requireAuthedSession } from "@/app/lib/auth-guard";
import { readExpenses, summarizeExpenses } from "@/app/lib/google-sheets";

export async function GET() {
  const session = await requireAuthedSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await readExpenses(session.accessToken);
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
