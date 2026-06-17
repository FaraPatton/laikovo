import { Building2 } from "lucide-react";
import FinanceDashboard from "@/app/components/finance-dashboard";

export default function Home() {
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
      </header>

      <FinanceDashboard />
    </main>
  );
}
