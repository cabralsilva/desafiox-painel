import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/supportChat";
import { FileText, ImageIcon, Video } from "lucide-react";
import { useEffect, useMemo } from "react";

export type AttachKind = "image" | "video" | "file";

export function SendFilesConfirmDialog({
  files,
  kind,
  sending,
  onCancel,
  onConfirm,
}: {
  files: File[];
  kind: AttachKind;
  sending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => {
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [urls]);

  const plural = files.length > 1;
  const title =
    kind === "image"
      ? plural
        ? "Enviar fotos"
        : "Enviar foto"
      : kind === "video"
        ? plural
          ? "Enviar vídeos"
          : "Enviar vídeo"
        : plural
          ? "Enviar arquivos"
          : "Enviar arquivo";

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !sending) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {plural
              ? `Confirme o envio de ${files.length} anexos.`
              : "Confirme o envio deste anexo."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {files.map((file, index) => (
            <PendingFilePreview key={`${file.name}-${file.size}-${index}`} file={file} kind={kind} url={urls[index]} />
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" className="h-12" onClick={onCancel} disabled={sending}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" className="h-12" onClick={onConfirm} disabled={sending}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PendingFilePreview({
  file,
  kind,
  url,
}: {
  file: File;
  kind: AttachKind;
  url?: string;
}) {
  if (kind === "image" && url) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <img src={url} alt="" className="h-40 w-full object-cover" />
        <p className="truncate px-3 py-2 text-xs text-muted-foreground">
          {file.name} · {formatBytes(file.size)}
        </p>
      </div>
    );
  }
  if (kind === "video" && url) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <video src={url} className="h-40 w-full object-cover" muted />
        <p className="truncate px-3 py-2 text-xs text-muted-foreground">
          {file.name} · {formatBytes(file.size)}
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
      {kind === "image" ? (
        <ImageIcon className="h-5 w-5 shrink-0 text-accent" />
      ) : kind === "video" ? (
        <Video className="h-5 w-5 shrink-0 text-accent" />
      ) : (
        <FileText className="h-5 w-5 shrink-0 text-accent" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
    </div>
  );
}
