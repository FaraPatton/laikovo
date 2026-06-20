import { apiFailure, apiSuccess } from "@/app/lib/api-response";
import { summarizeExpenses } from "@/app/lib/finance-summary";
import { isPinAuthorized } from "@/app/lib/pin-auth";
import { expenseRepository } from "@/app/repositories";

export async function GET() {
  if (!(await isPinAuthorized())) {
    return apiFailure("UNAUTHORIZED", "Требуется авторизация.", 401);
  }

  try {
    const expenses = await expenseRepository.list();
    return apiSuccess(summarizeExpenses(expenses));
  } catch (error) {
    console.error("Unable to read finance summary", error);
    return apiFailure("UPSTREAM_ERROR", "Не удалось загрузить расходы.", 500);
  }
}
