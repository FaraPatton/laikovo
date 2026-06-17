"use client";

import { Building2, Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/pin", { cache: "no-store" });
        const data = (await response.json()) as { authorized?: boolean };
        setAuthorized(Boolean(data.authorized));
      } finally {
        setIsChecking(false);
      }
    }

    void checkSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });
      const data = (await response.json()) as {
        authorized?: boolean;
        error?: string;
      };

      if (!response.ok || !data.authorized) {
        throw new Error(data.error || "Неверный PIN.");
      }

      setAuthorized(true);
      setPin("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Неверный PIN.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <main className="pin-page">
        <Loader2 className="spin" size={26} />
      </main>
    );
  }

  if (authorized) {
    return children;
  }

  return (
    <main className="pin-page">
      <section className="pin-panel">
        <div className="brand-mark" aria-hidden="true">
          <Building2 size={30} />
        </div>
        <div>
          <p className="eyebrow">Лайково</p>
          <h1>Финансы ремонта</h1>
          <p className="pin-copy">Введите PIN для доступа к приложению.</p>
        </div>
        <form className="pin-form" onSubmit={handleSubmit}>
          <label>
            PIN
            <input
              autoComplete="current-password"
              inputMode="numeric"
              maxLength={12}
              onChange={(event) => setPin(event.target.value)}
              placeholder="••••"
              type="password"
              value={pin}
            />
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <LockKeyhole size={18} />
            )}
            Открыть
          </button>
        </form>
        {error && <div className="notice error">{error}</div>}
      </section>
    </main>
  );
}
