export type ExpenseSource = "legacy" | "operations";

export type ExpenseStatus = "paid" | "planned" | "pending";

export type Expense = {
  id: string;
  date: string | null;
  description: string;
  amount: number;
  category: string;
  room: string | null;
  vendor: string | null;
  status: ExpenseStatus;
  source: ExpenseSource;
  rowNumber?: number;
};

export type FinanceSummary = {
  totals: {
    all: number;
    paid: number;
    planned: number;
    legacy: number;
    operations: number;
  };
  byCategory: Array<{ name: string; amount: number }>;
  byRoom: Array<{ name: string; amount: number }>;
  byMonth: Array<{ month: string; amount: number }>;
  recentExpenses: Expense[];
  expenses: Expense[];
};

export type ExpenseInput = {
  date: string;
  description: string;
  amount: number;
  category: string;
  room?: string;
  vendor?: string;
  status?: ExpenseStatus;
};

export const DEFAULT_CATEGORIES = [
  "Черновая",
  "Чистовая материалы",
  "Работы",
  "Мебель",
  "Техника",
  "Свет",
  "Сантехника",
  "Двери",
  "Расходники",
  "Прочее",
];

export const DEFAULT_ROOMS = [
  "Спальня",
  "Гостиная",
  "Кухня",
  "Кабинет + коридор",
  "Санузел",
  "Лоджия",
  "Общее",
];
