import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { LandscapeGate } from "@/components/LandscapeGate";
import { cn } from "@/lib/utils";

interface FullScreenPageProps {
  title: string;
  backTo?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fillHeight?: boolean;
}

export function FullScreenPage({
  title,
  backTo = "/app/campeonatos",
  onBack,
  children,
  footer,
  fillHeight = false,
}: FullScreenPageProps) {
  const backClass = cn(
    "flex shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground",
    fillHeight ? "h-[70%] max-h-12 aspect-square" : "h-12 w-12"
  );

  return (
    <LandscapeGate>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <header
          className={cn(
            "flex min-h-0 items-center gap-3 border-b border-border bg-card/95 px-3",
            fillHeight ? "h-[12%] min-h-12 max-h-16 shrink-0" : "shrink-0 py-3 safe-area-top"
          )}
        >
          {onBack ? (
            <button type="button" onClick={onBack} className={backClass} aria-label="Voltar">
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <Link to={backTo} className={backClass} aria-label="Voltar">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          )}
          <h1 className="min-w-0 flex-1 truncate text-base font-black tracking-tight md:text-lg">{title}</h1>
        </header>
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            fillHeight ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          {children}
        </main>
        {footer && (
          <footer className="shrink-0 border-t border-border bg-card p-3 safe-area-bottom">
            {footer}
          </footer>
        )}
      </div>
    </LandscapeGate>
  );
}
