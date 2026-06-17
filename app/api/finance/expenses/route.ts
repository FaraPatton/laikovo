import { NextResponse } from "next/server";
import { requireAuthedSession } from "@/app/lib/auth-guard";
import { appendExpense } from "@/app/lib/google-sheets";
import { ExpenseInput } from "@/app/lib/finance-types";

function validateExpenseInput(body: Partial<ExpenseInput>) {
  if (!body.date || !body.description || !body.category) {
    return "Дата, описание и категория обязательны.";
  }

  if (typeof body.amount !== "number" || body.amount <= 0) {
    return "Сумма должна быть положительным числом.";
  }

  return null;
}

export async function POST(request: Request) {
  const session = await requireAuthedSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ExpenseInput>;
  const validationError = validateExpenseInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await appendExpense(session.accessToken, body as ExpenseInput);
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
