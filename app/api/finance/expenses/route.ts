import { apiFailure, apiSuccess } from "@/app/lib/api-response";
import { expenseInputSchema } from "@/app/lib/expense-schema";
import { isPinAuthorized } from "@/app/lib/pin-auth";
import { expenseRepository } from "@/app/repositories";

export async function POST(request: Request) {
  if (!(await isPinAuthorized())) {
    return apiFailure("UNAUTHORIZED", "Требуется авторизация.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiFailure("INVALID_JSON", "Некорректный JSON.", 400);
  }

  const result = expenseInputSchema.safeParse(body);

  if (!result.success) {
    return apiFailure(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ?? "Некорректные данные.",
      400,
    );
  }

  try {
    await expenseRepository.append(result.data);
    return apiSuccess(null);
  } catch (error) {
    console.error("Unable to append expense", error);
    return apiFailure("UPSTREAM_ERROR", "Не удалось сохранить расход.", 500);
  }
}
