import { apiFailure, apiSuccess } from "@/app/lib/api-response";
import { readExpenses, summarizeExpenses } from "@/app/lib/google-sheets";
import { isPinAuthorized } from "@/app/lib/pin-auth";

export async function GET() {
  if (!(await isPinAuthorized())) {
    return apiFailure("UNAUTHORIZED", "Требуется авторизация.", 401);
  }

  try {
    const expenses = await readExpenses();
    return apiSuccess(summarizeExpenses(expenses));
  } catch (error) {
    console.error("Unable to read finance summary", error);
    return apiFailure("UPSTREAM_ERROR", "Не удалось загрузить расходы.", 500);
  }
}
