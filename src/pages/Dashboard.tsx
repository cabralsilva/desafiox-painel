import { DASHBOARD_BIG_NUMBERS } from "@/data/dashboardMock";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  highlight: "text-highlight",
  success: "text-success",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do DESAFIOX. Números ilustrativos até as métricas da API existirem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DASHBOARD_BIG_NUMBERS.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft inner-border"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className={cn("mt-3 text-4xl font-black tabular-nums", TONE_CLASS[item.tone])}>
              {item.value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.hint}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
