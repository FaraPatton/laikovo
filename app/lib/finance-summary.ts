import { Expense, FinanceSummary } from "@/app/lib/finance-types";
import { monthKey } from "@/app/lib/format";

export function summarizeExpenses(expenses: Expense[]): FinanceSummary {
  const paid = expenses
    .filter((expense) => expense.status === "paid")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const planned = expenses
    .filter((expense) => expense.status !== "paid")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const legacy = expenses
    .filter((expense) => expense.source === "legacy")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const operations = expenses
    .filter((expense) => expense.source === "operations")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = aggregate(expenses, (expense) => expense.category);
  const byRoom = aggregate(
    expenses.filter((expense) => expense.room),
    (expense) => expense.room ?? "Без комнаты",
  );
  const byMonth = aggregate(expenses, (expense) => monthKey(expense.date)).sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  return {
    totals: {
      all: paid + planned,
      paid,
      planned,
      legacy,
      operations,
    },
    byCategory,
    byRoom,
    byMonth: byMonth.map((item) => ({ month: item.name, amount: item.amount })),
    recentExpenses: expenses.slice(0, 10),
    expenses,
  };
}

function aggregate(
  expenses: Expense[],
  keyGetter: (expense: Expense) => string,
) {
  const map = new Map<string, number>();

  for (const expense of expenses) {
    const key = keyGetter(expense);
    map.set(key, (map.get(key) ?? 0) + expense.amount);
  }

  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}
