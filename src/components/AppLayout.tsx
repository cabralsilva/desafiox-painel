import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav, NAV_ITEMS } from "@/components/SidebarNav";
import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = NAV_ITEMS.find((item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const isChat = location.pathname.startsWith("/app/chat-suporte");

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-md safe-area-top lg:hidden",
            isChat && "shrink-0"
          )}
        >
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <Wordmark className="text-lg" />
            {current && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {current.label}
              </p>
            )}
          </div>
        </header>

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isChat
              ? "overflow-hidden p-0"
              : "overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6"
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
