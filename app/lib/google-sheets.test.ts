import { describe, expect, it } from "vitest";
import { summarizeExpenses } from "@/app/lib/google-sheets";
import { Expense } from "@/app/lib/finance-types";

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    date: "2026-06-18",
    description: "Расход",
    amount: 100,
    category: "Прочее",
    room: "Общее",
    vendor: null,
    status: "paid",
    source: "operations",
    ...overrides,
  };
}

describe("summarizeExpenses", () => {
  it("calculates totals and grouped analytics", () => {
    const summary = summarizeExpenses([
      expense({
        id: "legacy-paid",
        amount: 100,
        category: "Свет",
        room: "Кухня",
        source: "legacy",
        date: "2026-05-10",
      }),
      expense({
        id: "operation-planned",
        amount: 50,
        category: "Свет",
        room: "Кухня",
        status: "planned",
        date: "2026-06-10",
      }),
      expense({
        id: "operation-pending",
        amount: 25,
        category: "Мебель",
        room: null,
        status: "pending",
        date: "2026-06-15",
      }),
    ]);

    expect(summary.totals).toEqual({
      all: 175,
      paid: 100,
      planned: 75,
      legacy: 100,
      operations: 75,
    });
    expect(summary.byCategory).toEqual([
      { name: "Свет", amount: 150 },
      { name: "Мебель", amount: 25 },
    ]);
    expect(summary.byRoom).toEqual([{ name: "Кухня", amount: 150 }]);
    expect(summary.byMonth).toEqual([
      { month: "2026-05", amount: 100 },
      { month: "2026-06", amount: 75 },
    ]);
  });

  it("keeps only the first ten recent expenses", () => {
    const expenses = Array.from({ length: 12 }, (_, index) =>
      expense({ id: `expense-${index}` }),
    );

    const summary = summarizeExpenses(expenses);

    expect(summary.recentExpenses).toHaveLength(10);
    expect(summary.recentExpenses.map((item) => item.id)).toEqual(
      expenses.slice(0, 10).map((item) => item.id),
    );
  });

  it("groups expenses without a date under a readable label", () => {
    const summary = summarizeExpenses([expense({ date: null })]);

    expect(summary.byMonth).toEqual([{ month: "Без даты", amount: 100 }]);
  });
});
