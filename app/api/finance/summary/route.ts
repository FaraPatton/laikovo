import { NextResponse } from "next/server";
import { readExpenses, summarizeExpenses } from "@/app/lib/google-sheets";

export async function GET() {
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
