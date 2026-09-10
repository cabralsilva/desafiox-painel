import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoundStatus, RoundStatusTranslation } from "@/types/championship-round";

const STATUS_ACTIONS = [
  // { status: RoundStatus.SCHEDULED, variant: "secondary" as const },
  { status: RoundStatus.IN_PROGRESS, variant: "accent" as const },
  // { status: RoundStatus.IN_HOMOLOGATION, variant: "highlight" as const },
  { status: RoundStatus.FINISHED, variant: "default" as const },
  // { status: RoundStatus.CANCELLED, variant: "destructive" as const },
];

interface RoundStatusEditModalProps {
  open: boolean;
  current: RoundStatus;
  saving?: boolean;
  pending?: RoundStatus | null;
  onClose: () => void;
  onSelect: (status: RoundStatus) => void;
}

export function RoundStatusEditModal({
  open,
  current,
  saving,
  pending,
  onClose,
  onSelect,
}: RoundStatusEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status da rodada</DialogTitle>
          <DialogDescription>
            Escolha o novo status. Cada opção dispara um processo diferente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          {STATUS_ACTIONS.map(({ status, variant }) => {
            const active = status === current;
            const loading = saving && pending === status;
            return (
              <Button
                key={status}
                type="button"
                variant={active ? "outline" : variant}
                size="lg"
                className={`h-14 ${status === RoundStatus.CANCELLED ? "col-span-2" : ""}`}
                disabled={saving || active}
                onClick={() => onSelect(status)}
              >
                {loading ? "Aplicando..." : RoundStatusTranslation[status]}
              </Button>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" size="lg" className="h-14" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
