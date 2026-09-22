import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renderWhatsAppTemplatePreview } from "@/types/whatsapp-template";
import type { IWhatsAppTemplate } from "@/types/whatsapp-template";
import { useEffect, useMemo, useState } from "react";

export function WhatsAppTemplateVariablesDialog({
  open,
  template,
  sending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  template: IWhatsAppTemplate | null;
  sending?: boolean;
  onClose: () => void;
  onConfirm: (values: Record<string, string>) => void | Promise<void>;
}) {
  const variables = template?.variables ?? [];
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !template) return;
    const initial: Record<string, string> = {};
    for (const variable of template.variables || []) {
      initial[variable.key] = variable.example || "";
    }
    setValues(initial);
  }, [open, template]);

  const preview = useMemo(
    () => (template ? renderWhatsAppTemplatePreview(template, values) : ""),
    [template, values]
  );

  const missing = variables.filter((variable) => !String(values[variable.key] || "").trim());
  const canSubmit = Boolean(template) && missing.length === 0 && !sending;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !sending) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Preencher template</DialogTitle>
          <DialogDescription>
            {template ? `${template.name} (${template.language})` : "Selecione um template."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {variables.map((variable) => (
            <div key={variable.key} className="space-y-1.5">
              <Label htmlFor={`tpl-${variable.key}`}>{variable.label}</Label>
              <Input
                id={`tpl-${variable.key}`}
                value={values[variable.key] ?? ""}
                placeholder={variable.example || variable.label}
                disabled={sending}
                onChange={(e) => setValues((prev) => ({ ...prev, [variable.key]: e.target.value }))}
              />
            </div>
          ))}
          {preview ? (
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Prévia no chat
              </p>
              <p className="whitespace-pre-wrap text-sm">{preview}</p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={sending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" disabled={!canSubmit} onClick={() => void onConfirm(values)}>
            Enviar template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
