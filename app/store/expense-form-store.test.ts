import { beforeEach, describe, expect, it } from "vitest";
import {
  createEmptyExpenseForm,
  useExpenseFormStore,
} from "@/app/store/expense-form-store";

describe("expense form store", () => {
  beforeEach(() => {
    useExpenseFormStore.setState({
      form: createEmptyExpenseForm("2026-06-18"),
    });
  });

  it("updates only the supplied fields", () => {
    useExpenseFormStore.getState().updateForm({
      amount: 12500,
      description: "Светильники",
    });

    expect(useExpenseFormStore.getState().form).toMatchObject({
      date: "2026-06-18",
      amount: 12500,
      description: "Светильники",
      category: "Прочее",
    });
  });

  it("resets the draft but preserves its date", () => {
    useExpenseFormStore.getState().updateForm({
      amount: 12500,
      description: "Светильники",
    });

    useExpenseFormStore.getState().resetForm();

    expect(useExpenseFormStore.getState().form).toEqual(
      createEmptyExpenseForm("2026-06-18"),
    );
  });
});
