import { ExpenseRepository } from "@/app/repositories/expense-repository";
import {
  appendExpense,
  ensureOperationsSheet,
  readExpenses,
} from "@/app/lib/google-sheets";

export class GoogleSheetsExpenseRepository implements ExpenseRepository {
  setup() {
    return ensureOperationsSheet();
  }

  list() {
    return readExpenses();
  }

  append(input: Parameters<ExpenseRepository["append"]>[0]) {
    return appendExpense(input);
  }
}
