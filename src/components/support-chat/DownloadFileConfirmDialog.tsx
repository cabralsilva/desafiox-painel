import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

export function DownloadFileConfirmDialog({
  name,
  sizeLabel,
  open,
  onCancel,
  onConfirm,
}: {
  name: string;
  sizeLabel?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixar arquivo</DialogTitle>
          <DialogDescription>Confirme o download deste arquivo.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
          <FileText className="h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {sizeLabel ? <p className="text-xs text-muted-foreground">{sizeLabel}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" className="h-12" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" className="h-12" onClick={onConfirm}>
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
