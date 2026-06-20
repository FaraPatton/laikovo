import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  apiFetch,
} from "@/app/lib/api-contract";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from a successful API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { total: 12500 } }),
      })),
    );

    await expect(apiFetch<{ total: number }>("/api/summary")).resolves.toEqual({
      total: 12500,
    });
  });

  it("throws a typed error returned by the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Некорректная сумма." },
        }),
      })),
    );

    await expect(apiFetch("/api/expenses")).rejects.toMatchObject({
      name: "ApiClientError",
      code: "VALIDATION_ERROR",
      message: "Некорректная сумма.",
      status: 400,
    } satisfies Partial<ApiClientError>);
  });

  it("rejects a response that does not follow the contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ total: 12500 }),
      })),
    );

    await expect(apiFetch("/api/summary")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 200,
    });
  });
});
