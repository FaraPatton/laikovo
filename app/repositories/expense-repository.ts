import { Expense, ExpenseInput } from "@/app/lib/finance-types";

export interface ExpenseRepository {
  setup(): Promise<void>;
  list(): Promise<Expense[]>;
  append(input: ExpenseInput): Promise<void>;
}
