import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, Fragment } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinanceDashboard from "@/app/components/finance-dashboard";
import { FinanceSummary } from "@/app/lib/finance-types";
import {
  createEmptyExpenseForm,
  useExpenseFormStore,
} from "@/app/store/expense-form-store";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    createElement(Fragment, null, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children),
  Bar: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
  Pie: ({ children }: { children: React.ReactNode }) =>
    createElement(Fragment, null, children),
  PieChart: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const summary: FinanceSummary = {
  totals: { all: 0, paid: 0, planned: 0, legacy: 0, operations: 0 },
  byCategory: [],
  byRoom: [],
  byMonth: [],
  recentExpenses: [],
  expenses: [],
};

describe("FinanceDashboard", () => {
  beforeEach(() => {
    useExpenseFormStore.setState({
      form: createEmptyExpenseForm("2026-06-18"),
    });
  });

  it("submits an expense and resets the draft", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => ({
        ok: true,
        json: async () =>
          String(input).includes("/api/finance/summary")
            ? summary
            : { ok: true },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(createElement(FinanceDashboard));

    await screen.findByRole("heading", { name: "Новый расход" });
    await user.type(screen.getByLabelText("Сумма"), "12500");
    await user.type(screen.getByLabelText("Описание"), "Светильники");
    await user.type(screen.getByLabelText("Контрагент"), "Магазин света");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/finance/expenses",
        expect.objectContaining({ method: "POST" }),
      );
    });

    const expenseCall = fetchMock.mock.calls.find(
      ([input]) => input === "/api/finance/expenses",
    );
    const request = expenseCall?.[1] as RequestInit;

    expect(JSON.parse(String(request.body))).toMatchObject({
      amount: 12500,
      description: "Светильники",
      vendor: "Магазин света",
    });
    expect(await screen.findByText("Расход добавлен.")).toBeInTheDocument();
    expect(screen.getByLabelText("Сумма")).toHaveValue(null);
    expect(screen.getByLabelText("Описание")).toHaveValue("");
  });
});
