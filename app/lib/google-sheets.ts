import { Expense, ExpenseInput, FinanceSummary } from "@/app/lib/finance-types";
import { monthKey } from "@/app/lib/format";
import { getGoogleAccessToken } from "@/app/lib/google-service-account";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_LEGACY_SHEET = "Ремонт";
const DEFAULT_OPERATIONS_SHEET = "Операции";

const OPERATION_HEADERS = [
  "Дата",
  "Тип",
  "Категория",
  "Комната",
  "Контрагент",
  "Описание",
  "Сумма",
  "Статус",
  "Источник",
  "Создано",
];

type GoogleValuesResponse = {
  values?: Array<Array<string | number | boolean>>;
};

type SpreadsheetMeta = {
  sheets?: Array<{
    properties?: {
      title?: string;
      sheetId?: number;
    };
  }>;
};

function getSheetId() {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is not configured.");
  }

  return sheetId;
}

function legacySheetName() {
  return process.env.GOOGLE_SHEET_LEGACY_NAME || DEFAULT_LEGACY_SHEET;
}

function operationsSheetName() {
  return process.env.GOOGLE_SHEET_OPERATIONS_NAME || DEFAULT_OPERATIONS_SHEET;
}

function encodeRange(range: string) {
  return encodeURIComponent(range);
}

async function googleFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${SHEETS_API}/${getSheetId()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== "string") {
    return null;
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const russianDate = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (russianDate) {
    const year =
      russianDate[3].length === 2 ? `20${russianDate[3]}` : russianDate[3];
    return `${year}-${russianDate[2].padStart(2, "0")}-${russianDate[1].padStart(2, "0")}`;
  }

  return null;
}

function legacyCategoryForRow(rowNumber: number) {
  if (rowNumber <= 134) {
    return "Черновая";
  }

  if (rowNumber <= 196) {
    return "Чистовая материалы";
  }

  if (rowNumber >= 198) {
    return "Мебель и техника";
  }

  return "Прочее";
}

function parseLegacyExpenses(rows: GoogleValuesResponse["values"] = []) {
  return rows
    .map((row, index): Expense | null => {
      const rowNumber = index + 1;
      const description = row[2]?.toString().trim();
      const amount = toNumber(row[3]);

      if (rowNumber < 7 || !description || amount === 0) {
        return null;
      }

      return {
        id: `legacy-${rowNumber}`,
        rowNumber,
        date: toIsoDate(row[1]),
        description,
        amount,
        category: legacyCategoryForRow(rowNumber),
        room: null,
        vendor: null,
        status: "paid",
        source: "legacy",
      };
    })
    .filter((expense): expense is Expense => Boolean(expense));
}

function parseOperations(rows: GoogleValuesResponse["values"] = []) {
  return rows
    .slice(1)
    .map((row, index): Expense | null => {
      const rowNumber = index + 2;
      const description = row[5]?.toString().trim();
      const amount = toNumber(row[6]);

      if (!description || amount === 0) {
        return null;
      }

      return {
        id: `operations-${rowNumber}`,
        rowNumber,
        date: toIsoDate(row[0]),
        description,
        amount,
        category: row[2]?.toString().trim() || "Прочее",
        room: row[3]?.toString().trim() || null,
        vendor: row[4]?.toString().trim() || null,
        status:
          row[7] === "planned" || row[7] === "pending" ? row[7] : "paid",
        source: "operations",
      };
    })
    .filter((expense): expense is Expense => Boolean(expense));
}

async function getValues(accessToken: string, range: string) {
  return googleFetch<GoogleValuesResponse>(
    accessToken,
    `/values/${encodeRange(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
  );
}

export async function ensureOperationsSheet() {
  const accessToken = await getGoogleAccessToken();
  const meta = await googleFetch<SpreadsheetMeta>(
    accessToken,
    "?fields=sheets.properties.title",
  );
  const name = operationsSheetName();
  const exists = meta.sheets?.some((sheet) => sheet.properties?.title === name);

  if (!exists) {
    await googleFetch(accessToken, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: name,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
            },
          },
        ],
      }),
    });
  }

  const headerRange = `${name}!A1:J1`;
  await googleFetch(
    accessToken,
    `/values/${encodeRange(headerRange)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({
        range: headerRange,
        majorDimension: "ROWS",
        values: [OPERATION_HEADERS],
      }),
    },
  );
}

export async function appendExpense(input: ExpenseInput) {
  const accessToken = await getGoogleAccessToken();
  await ensureOperationsSheet();

  const now = new Date().toISOString();
  const range = `${operationsSheetName()}!A:J`;
  const values = [
    [
      input.date,
      "expense",
      input.category,
      input.room ?? "",
      input.vendor ?? "",
      input.description,
      input.amount,
      input.status ?? "paid",
      "app",
      now,
    ],
  ];

  await googleFetch(
    accessToken,
    `/values/${encodeRange(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values,
      }),
    },
  );
}

export async function readExpenses() {
  const accessToken = await getGoogleAccessToken();
  const [legacy, operations] = await Promise.allSettled([
    getValues(accessToken, `${legacySheetName()}!A1:P1000`),
    getValues(accessToken, `${operationsSheetName()}!A1:J2000`),
  ]);

  const legacyExpenses =
    legacy.status === "fulfilled" ? parseLegacyExpenses(legacy.value.values) : [];
  const operationExpenses =
    operations.status === "fulfilled"
      ? parseOperations(operations.value.values)
      : [];

  return [...legacyExpenses, ...operationExpenses].sort((a, b) => {
    const dateA = a.date ?? "";
    const dateB = b.date ?? "";
    return dateB.localeCompare(dateA);
  });
}

export function summarizeExpenses(expenses: Expense[]): FinanceSummary {
  const paid = expenses
    .filter((expense) => expense.status === "paid")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const planned = expenses
    .filter((expense) => expense.status !== "paid")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const legacy = expenses
    .filter((expense) => expense.source === "legacy")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const operations = expenses
    .filter((expense) => expense.source === "operations")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = aggregate(expenses, (expense) => expense.category);
  const byRoom = aggregate(
    expenses.filter((expense) => expense.room),
    (expense) => expense.room ?? "Без комнаты",
  );
  const byMonth = aggregate(expenses, (expense) => monthKey(expense.date)).sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  return {
    totals: {
      all: paid + planned,
      paid,
      planned,
      legacy,
      operations,
    },
    byCategory,
    byRoom,
    byMonth: byMonth.map((item) => ({ month: item.name, amount: item.amount })),
    recentExpenses: expenses.slice(0, 10),
    expenses,
  };
}

function aggregate(
  expenses: Expense[],
  keyGetter: (expense: Expense) => string,
) {
  const map = new Map<string, number>();

  for (const expense of expenses) {
    const key = keyGetter(expense);
    map.set(key, (map.get(key) ?? 0) + expense.amount);
  }

  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}
