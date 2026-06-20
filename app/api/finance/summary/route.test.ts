import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FinanceSummary } from "@/app/lib/finance-types";

const mocks = vi.hoisted(() => ({
  isPinAuthorized: vi.fn(),
  list: vi.fn(),
  summarizeExpenses: vi.fn(),
}));

vi.mock("@/app/repositories", () => ({
  expenseRepository: { list: mocks.list },
}));

vi.mock("@/app/lib/finance-summary", () => ({
  summarizeExpenses: mocks.summarizeExpenses,
}));

vi.mock("@/app/lib/pin-auth", () => ({
  isPinAuthorized: mocks.isPinAuthorized,
}));

import { GET } from "@/app/api/finance/summary/route";

const summary: FinanceSummary = {
  totals: { all: 100, paid: 100, planned: 0, legacy: 0, operations: 100 },
  byCategory: [{ name: "Свет", amount: 100 }],
  byRoom: [],
  byMonth: [],
  recentExpenses: [],
  expenses: [],
};

describe("GET /api/finance/summary", () => {
  beforeEach(() => {
    mocks.isPinAuthorized.mockResolvedValue(true);
    mocks.list.mockResolvedValue([]);
    mocks.summarizeExpenses.mockReturnValue(summary);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns a summary through the shared API contract", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: summary });
    expect(mocks.summarizeExpenses).toHaveBeenCalledWith([]);
  });

  it("maps storage failures to a safe upstream error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.list.mockRejectedValue(new Error("Private Google error"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: "Не удалось загрузить расходы.",
      },
    });
  });
});
