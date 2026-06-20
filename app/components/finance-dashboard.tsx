"use client";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleDollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/app/lib/api-contract";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ROOMS,
  ExpenseInput,
  FinanceSummary,
} from "@/app/lib/finance-types";
import { formatDate, formatRub } from "@/app/lib/format";
import { useExpenseFormStore } from "@/app/store/expense-form-store";

const chartColors = ["#70e1b8", "#f6b860", "#83b7ff", "#c79cff", "#f07588"];

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useExpenseFormStore((state) => state.form);
  const updateForm = useExpenseFormStore((state) => state.updateForm);
  const resetForm = useExpenseFormStore((state) => state.resetForm);

  async function loadSummary() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch<FinanceSummary>("/api/finance/summary", {
        cache: "no-store",
      });

      setSummary(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить данные.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  const topCategories = useMemo(
    () => summary?.byCategory.slice(0, 6) ?? [],
    [summary],
  );

  async function handleSetup() {
    setMessage(null);
    setError(null);

    try {
      await apiFetch<null>("/api/finance/setup", { method: "POST" });

      setMessage("Лист Операции готов.");
      await loadSummary();
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Не удалось подготовить лист.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await apiFetch<null>("/api/finance/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          room: form.room || undefined,
          vendor: form.vendor || undefined,
        }),
      });

      setMessage("Расход добавлен.");
      resetForm();
      await loadSummary();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить расход.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && !summary) {
    return (
      <section className="loading-state">
        <Loader2 className="spin" size={28} />
        Загрузка финансов
      </section>
    );
  }

  return (
    <div className="dashboard-grid">
      <section className="panel form-panel command-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Быстрая операция</span>
            <h2>Новый расход</h2>
          </div>
          <button className="soft-button" type="button" onClick={handleSetup}>
            <Plus size={16} />
            Лист
          </button>
        </div>

        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            Дата
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateForm({ date: event.target.value })}
              required
            />
          </label>
          <label>
            Сумма
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={form.amount || ""}
              onChange={(event) =>
                updateForm({ amount: Number(event.target.value) })
              }
              required
            />
          </label>
          <label>
            Категория
            <select
              value={form.category}
              onChange={(event) => updateForm({ category: event.target.value })}
            >
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Комната
            <select
              value={form.room}
              onChange={(event) => updateForm({ room: event.target.value })}
            >
              {DEFAULT_ROOMS.map((room) => (
                <option key={room}>{room}</option>
              ))}
            </select>
          </label>
          <label className="description-field">
            Описание
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                updateForm({ description: event.target.value })
              }
              required
            />
          </label>
          <label>
            Контрагент
            <input
              value={form.vendor}
              onChange={(event) => updateForm({ vendor: event.target.value })}
              placeholder="Сергей, Леруа, Авито"
            />
          </label>
          <label>
            Статус
            <select
              value={form.status}
              onChange={(event) =>
                updateForm({
                  status: event.target.value as ExpenseInput["status"],
                })
              }
            >
              <option value="paid">Оплачено</option>
              <option value="planned">План</option>
              <option value="pending">Ожидает</option>
            </select>
          </label>
          <button className="primary-button save-button" type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            Сохранить
          </button>
        </form>

        {(message || error) && (
          <div className={error ? "notice error" : "notice"}>
            {error ? <AlertCircle size={16} /> : <Check size={16} />}
            {error || message}
          </div>
        )}
      </section>

      <section className="summary-band">
        <KpiCard
          icon={<CircleDollarSign size={20} />}
          label="Всего"
          value={formatRub(summary?.totals.all ?? 0)}
        />
        <KpiCard
          icon={<Check size={20} />}
          label="Оплачено"
          value={formatRub(summary?.totals.paid ?? 0)}
        />
        <KpiCard
          icon={<CalendarDays size={20} />}
          label="План"
          value={formatRub(summary?.totals.planned ?? 0)}
        />
        <KpiCard
          icon={<Wrench size={20} />}
          label="Новые записи"
          value={formatRub(summary?.totals.operations ?? 0)}
        />
      </section>

      <section className="panel chart-panel wide">
        <div className="panel-heading">
          <h2>Расходы по месяцам</h2>
          <button className="icon-button" title="Обновить" onClick={loadSummary}>
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary?.byMonth ?? []}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}к`}
                width={46}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  color: "var(--ink)",
                }}
                formatter={(value) => formatRub(Number(value))}
                labelFormatter={(label) => `Месяц: ${label}`}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#3f6f5d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <h2>Категории</h2>
        </div>
        <div className="donut-layout">
          <div className="donut-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategories}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="86%"
                  paddingAngle={2}
                >
                  {topCategories.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    color: "var(--ink)",
                  }}
                  formatter={(value) => formatRub(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-list">
            {topCategories.map((item, index) => (
              <div className="legend-row" key={item.name}>
                <span
                  className="legend-dot"
                  style={{
                    background: chartColors[index % chartColors.length],
                  }}
                />
                <span>{item.name}</span>
                <strong>{formatRub(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel recent-panel wide">
        <div className="panel-heading">
          <h2>Последние расходы</h2>
        </div>
        <div className="expense-list">
          {(summary?.recentExpenses ?? []).map((expense) => (
            <article className="expense-row" key={expense.id}>
              <div>
                <span className="expense-date">{formatDate(expense.date)}</span>
                <h3>{expense.description}</h3>
                <p>
                  {expense.category}
                  {expense.room ? ` · ${expense.room}` : ""}
                  {expense.vendor ? ` · ${expense.vendor}` : ""}
                </p>
              </div>
              <strong>{formatRub(expense.amount)}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
