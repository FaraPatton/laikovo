import { describe, expect, it } from "vitest";
import { expenseInputSchema } from "@/app/lib/expense-schema";

const validExpense = {
  date: "2026-06-18",
  description: "Светильники",
  amount: 12500,
  category: "Свет",
};

describe("expenseInputSchema", () => {
  it("normalizes a valid expense and supplies the default status", () => {
    const result = expenseInputSchema.parse({
      ...validExpense,
      description: "  Светильники  ",
    });

    expect(result).toMatchObject({
      ...validExpense,
      description: "Светильники",
      status: "paid",
    });
  });

  it("rejects an invalid calendar date", () => {
    const result = expenseInputSchema.safeParse({
      ...validExpense,
      date: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = expenseInputSchema.safeParse({
      ...validExpense,
      amount: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported statuses", () => {
    const result = expenseInputSchema.safeParse({
      ...validExpense,
      status: "cancelled",
    });

    expect(result.success).toBe(false);
  });
});
