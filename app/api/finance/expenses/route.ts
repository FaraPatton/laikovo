import { NextResponse } from "next/server";
import { expenseInputSchema } from "@/app/lib/expense-schema";
import { appendExpense } from "@/app/lib/google-sheets";
import { isPinAuthorized } from "@/app/lib/pin-auth";

export async function POST(request: Request) {
  if (!(await isPinAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const result = expenseInputSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Некорректные данные." },
      { status: 400 },
    );
  }

  try {
    await appendExpense(result.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to append expense.",
      },
      { status: 500 },
    );
  }
}
