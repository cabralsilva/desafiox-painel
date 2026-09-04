import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { LandscapeGate } from "@/components/LandscapeGate";

interface FullScreenPageProps {
  title: string;
  backTo?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function FullScreenPage({ title, backTo = "/app/campeonatos", onBack, children, footer }: FullScreenPageProps) {
  return (
    <LandscapeGate>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 py-3 safe-area-top">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <Link
              to={backTo}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-black tracking-tight">{title}</h1>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        {footer && (
          <footer className="shrink-0 border-t border-border bg-card p-3 safe-area-bottom">
            {footer}
          </footer>
        )}
      </div>
    </LandscapeGate>
  );
}
