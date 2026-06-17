import { Building2, LogIn, LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import FinanceDashboard from "@/app/components/finance-dashboard";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="brand-mark" aria-hidden="true">
            <Building2 size={30} />
          </div>
          <div>
            <p className="eyebrow">Лайково</p>
            <h1>Контроль финансов</h1>
            <p className="auth-copy">
              Вход через Google-аккаунт из списка доступа.
            </p>
          </div>
          <a className="primary-button" href="/api/auth/signin/google">
            <LogIn size={18} />
            Войти через Google
          </a>
        </section>
      </main>
    );
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <div className="brand-mark small" aria-hidden="true">
            <Building2 size={22} />
          </div>
          <div>
            <p className="eyebrow">Лайково</p>
            <h1>Финансы ремонта</h1>
          </div>
        </div>
        <div className="account">
          <span>{session.user.email}</span>
          <form action={handleSignOut}>
            <button className="icon-button" title="Выйти" type="submit">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <FinanceDashboard />
    </main>
  );
}
