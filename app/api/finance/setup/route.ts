import { apiFailure, apiSuccess } from "@/app/lib/api-response";
import { isPinAuthorized } from "@/app/lib/pin-auth";
import { expenseRepository } from "@/app/repositories";

export async function POST() {
  if (!(await isPinAuthorized())) {
    return apiFailure("UNAUTHORIZED", "Требуется авторизация.", 401);
  }

  try {
    await expenseRepository.setup();
    return apiSuccess(null);
  } catch (error) {
    console.error("Unable to prepare operations sheet", error);
    return apiFailure("UPSTREAM_ERROR", "Не удалось подготовить лист.", 500);
  }
}
