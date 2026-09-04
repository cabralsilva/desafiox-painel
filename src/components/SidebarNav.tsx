import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Flame,
  Shield,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { clearAuthSession } from "@/lib/session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/campeonatos", label: "Campeonatos", icon: Trophy },
  { to: "/app/desafios", label: "Desafios", icon: Flame },
  { to: "/app/perfis-acesso", label: "Perfis de acesso", icon: Shield },
  { to: "/app/usuarios", label: "Usuários", icon: Users },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onNavigate?.();
    clearAuthSession();
    toast.success("Sessão encerrada.");
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 border-b border-sidebar-border px-5 py-5">
        <Wordmark className="text-xl" />
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Painel de gestão
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Menu principal">
        <ul className="divide-y divide-sidebar-border">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[56px] items-center gap-3 px-5 py-3 text-left transition-colors",
                    isActive
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")}
                      strokeWidth={isActive ? 2.4 : 1.7}
                    />
                    <span className="text-base font-semibold">{label}</span>
                    {isActive && (
                      <span className="ml-auto h-8 w-1 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border safe-area-bottom">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[56px] w-full items-center gap-3 px-5 py-3 text-left text-destructive transition-colors hover:bg-secondary/60"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-base font-semibold">Sair</span>
        </button>
      </div>
    </div>
  );
}
