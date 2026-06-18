import { create } from "zustand";
import { ExpenseInput } from "@/app/lib/finance-types";

export function createEmptyExpenseForm(
  date = new Date().toISOString().slice(0, 10),
): ExpenseInput {
  return {
    date,
    description: "",
    amount: 0,
    category: "Прочее",
    room: "Общее",
    vendor: "",
    status: "paid",
  };
}

type ExpenseFormStore = {
  form: ExpenseInput;
  updateForm: (patch: Partial<ExpenseInput>) => void;
  resetForm: () => void;
};

export const useExpenseFormStore = create<ExpenseFormStore>((set) => ({
  form: createEmptyExpenseForm(),
  updateForm: (patch) =>
    set((state) => ({
      form: { ...state.form, ...patch },
    })),
  resetForm: () =>
    set((state) => ({
      form: createEmptyExpenseForm(state.form.date),
    })),
}));
