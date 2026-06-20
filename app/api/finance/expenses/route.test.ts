import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendExpense: vi.fn(),
  isPinAuthorized: vi.fn(),
}));

vi.mock("@/app/lib/google-sheets", () => ({
  appendExpense: mocks.appendExpense,
}));

vi.mock("@/app/lib/pin-auth", () => ({
  isPinAuthorized: mocks.isPinAuthorized,
}));

import { POST } from "@/app/api/finance/expenses/route";

const validExpense = {
  date: "2026-06-18",
  description: "Светильники",
  amount: 12500,
  category: "Свет",
};

function request(body: string) {
  return new Request("http://localhost/api/finance/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/finance/expenses", () => {
  beforeEach(() => {
    mocks.isPinAuthorized.mockResolvedValue(true);
    mocks.appendExpense.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("rejects unauthorized requests before reading the payload", async () => {
    mocks.isPinAuthorized.mockResolvedValue(false);

    const response = await POST(request(JSON.stringify(validExpense)));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHORIZED" },
    });
    expect(mocks.appendExpense).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
  });

  it("rejects an expense that does not pass the Zod schema", async () => {
    const response = await POST(
      request(JSON.stringify({ ...validExpense, amount: 0 })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(mocks.appendExpense).not.toHaveBeenCalled();
  });

  it("normalizes and stores a valid expense", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          ...validExpense,
          description: "  Светильники  ",
        }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: null });
    expect(mocks.appendExpense).toHaveBeenCalledWith({
      ...validExpense,
      description: "Светильники",
      status: "paid",
    });
  });

  it("hides upstream details behind the public error contract", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.appendExpense.mockRejectedValue(
      new Error("Google Sheets API error 403: private details"),
    );

    const response = await POST(request(JSON.stringify(validExpense)));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: "Не удалось сохранить расход.",
      },
    });
  });
});
