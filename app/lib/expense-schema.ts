import { z } from "zod";

export const expenseStatusSchema = z.enum(["paid", "planned", "pending"]);

export const expenseInputSchema = z.object({
  date: z.iso.date({ error: "Укажите дату в формате ГГГГ-ММ-ДД." }),
  description: z
    .string()
    .trim()
    .min(2, "Описание должно содержать минимум 2 символа.")
    .max(300, "Описание не должно превышать 300 символов."),
  amount: z
    .number({ error: "Сумма должна быть числом." })
    .finite("Сумма должна быть конечным числом.")
    .positive("Сумма должна быть положительным числом."),
  category: z
    .string()
    .trim()
    .min(1, "Укажите категорию.")
    .max(100, "Категория не должна превышать 100 символов."),
  room: z
    .string()
    .trim()
    .max(100, "Название комнаты не должно превышать 100 символов.")
    .optional(),
  vendor: z
    .string()
    .trim()
    .max(150, "Название контрагента не должно превышать 150 символов.")
    .optional(),
  status: expenseStatusSchema.default("paid"),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type ExpenseStatus = z.infer<typeof expenseStatusSchema>;
