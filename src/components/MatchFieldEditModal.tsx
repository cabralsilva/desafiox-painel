import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MatchFieldEditModalProps {
  open: boolean;
  title: string;
  description?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}

export function MatchFieldEditModal({
  open,
  title,
  description,
  saving,
  onClose,
  onSave,
  children,
}: MatchFieldEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="py-2">{children}</div>
        <DialogFooter>
          <Button type="button" variant="secondary" size="lg" className="h-14" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" size="lg" className="h-14" onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useSyncedDraft<T>(open: boolean, source: T) {
  const [draft, setDraft] = useState(source);
  useEffect(() => {
    if (open) setDraft(source);
  }, [open, source]);
  return [draft, setDraft] as const;
}
