import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLandscapeLock } from "@/hooks/useLandscapeLock";
import { RotateCw } from "lucide-react";

export function LandscapeGate({ children }: { children: ReactNode }) {
  const { isPortrait } = useLandscapeLock(true);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {isPortrait && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-background/95 px-8 text-center">
          <RotateCw className="h-12 w-12 text-accent" />
          <p className="text-lg font-bold">Gire o dispositivo</p>
          <p className="text-sm text-muted-foreground">
            Esta tela funciona melhor em paisagem (landscape) no tablet e no smartphone.
          </p>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
