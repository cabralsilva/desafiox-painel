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
import type { OpenChampionshipGuessesResult } from "@/lib/api/championships";
import { utcISOToLocalDateString } from "@/lib/dates";
import { RoundStatus, RoundStatusTranslation } from "@/types/championship-round";
import { useEffect, useRef, useState } from "react";

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
  releasing?: boolean;
  releaseResult?: OpenChampionshipGuessesResult | null;
  startDate?: string | null;
  endDate?: string | null;
  savingPeriod?: boolean;
  onClose: () => void;
  onSelect: (status: RoundStatus) => void;
  onReleaseGuesses: () => void;
  onSavePeriod: (startDate: string | null, endDate: string | null) => void;
}

function toDateInput(value?: string | null): string {
  if (!value) return "";
  return utcISOToLocalDateString(value) ?? "";
}

function roundLabel(result: OpenChampionshipGuessesResult["results"][number]): string {
  if (result.sequenceOrder != null) return `Rodada ${result.sequenceOrder}`;
  return "Rodada de desafio";
}

export function RoundStatusEditModal({
  open,
  current,
  saving,
  pending,
  releasing,
  releaseResult,
  startDate,
  endDate,
  savingPeriod,
  onClose,
  onSelect,
  onReleaseGuesses,
  onSavePeriod,
}: RoundStatusEditModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [startDraft, setStartDraft] = useState("");
  const [endDraft, setEndDraft] = useState("");
  const [periodError, setPeriodError] = useState("");
  const wasReleasing = useRef(false);
  const busy = Boolean(saving || releasing || savingPeriod);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStartDraft(toDateInput(startDate));
    setEndDraft(toDateInput(endDate));
    setPeriodError("");
  }, [open, startDate, endDate]);

  const savePeriod = () => {
    if (startDraft && endDraft && endDraft < startDraft) {
      setPeriodError("O fim não pode ser anterior ao início.");
      return;
    }
    setPeriodError("");
    onSavePeriod(startDraft || null, endDraft || null);
  };

  useEffect(() => {
    if (wasReleasing.current && !releasing) setConfirming(false);
    wasReleasing.current = Boolean(releasing);
  }, [releasing]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="max-h-[min(100%,40rem)] overflow-y-auto">
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
                disabled={busy || active}
                onClick={() => onSelect(status)}
              >
                {loading ? "Aplicando..." : RoundStatusTranslation[status]}
              </Button>
            );
          })}
        </div>

        <section className="space-y-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-black">Período da rodada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Início e fim desta rodada. A data de cada jogo continua independente.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="round-start">Início</Label>
              <Input
                id="round-start"
                type="date"
                className="mt-2 h-14"
                value={startDraft}
                disabled={busy}
                onChange={(event) => {
                  setStartDraft(event.target.value);
                  setPeriodError("");
                }}
              />
            </div>
            <div>
              <Label htmlFor="round-end">Fim</Label>
              <Input
                id="round-end"
                type="date"
                className="mt-2 h-14"
                value={endDraft}
                disabled={busy}
                onChange={(event) => {
                  setEndDraft(event.target.value);
                  setPeriodError("");
                }}
              />
            </div>
          </div>
          {periodError ? <p className="text-sm text-destructive">{periodError}</p> : null}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="h-14 w-full"
            disabled={busy}
            onClick={savePeriod}
          >
            {savingPeriod ? "Salvando período..." : "Salvar período"}
          </Button>
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-black">Palpites do desafio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Libera o palpite das rodadas de desafio ligadas a esta rodada. O status da rodada do campeonato não muda.
            </p>
          </div>
          {confirming ? (
            <div className="space-y-3 rounded-xl bg-secondary/60 p-3">
              <p className="text-sm font-medium">
                Confirmar a liberação dos palpites? Os jogadores com palpite pendente serão avisados.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-14"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  className="h-14"
                  disabled={busy}
                  onClick={onReleaseGuesses}
                >
                  {releasing ? "Liberando..." : "Confirmar liberação"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="h-14 w-full"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              Liberar palpites
            </Button>
          )}
          {releaseResult ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{releaseResult.message}</p>
              <p className="text-muted-foreground">
                {releaseResult.opened} abertas
                {releaseResult.skipped ? `, ${releaseResult.skipped} já estavam abertas` : ""}
                {releaseResult.failed ? `, ${releaseResult.failed} com falha` : ""}
              </p>
              {releaseResult.results?.some((item) => item.status === "failed") ? (
                <ul className="space-y-1 text-destructive">
                  {releaseResult.results
                    .filter((item) => item.status === "failed")
                    .map((item) => (
                      <li key={item.challengeRoundId}>
                        {roundLabel(item)}
                        {item.message ? `: ${item.message}` : ""}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <DialogFooter>
          <Button type="button" variant="secondary" size="lg" className="h-14" onClick={onClose} disabled={busy}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
