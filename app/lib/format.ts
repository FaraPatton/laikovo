export const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatRub(value: number) {
  return rubFormatter.format(value);
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Без даты";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function monthKey(value: string | null) {
  if (!value) {
    return "Без даты";
  }

  return value.slice(0, 7);
}
