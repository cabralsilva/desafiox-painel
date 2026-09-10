import { RoundStatusEditModal } from "@/components/RoundStatusEditModal";
import { Button } from "@/components/ui/button";
import {
  finishChampionshipRound,
  openningChampionshipRound
} from "@/lib/api/championships";
import { IChampionshipPhase } from "@/types/championship-phase";
import { RoundStatus, RoundStatusTranslation, type IChampionshipRound } from "@/types/championship-round";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RoundNavProps {
  round: IChampionshipRound;
  roundIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onRoundUpdated: (round: IChampionshipRound) => void;
}

export function RoundNav({ round, roundIndex, total, onPrev, onNext, onRoundUpdated }: RoundNavProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<RoundStatus | null>(null);

  const label = round.label ?? `Rodada ${(round.globalRoundIndex ?? roundIndex) + 1}`;
  const phase = round.phase ? (round.phase as IChampionshipPhase).description : "";
  const status = RoundStatusTranslation[round.status] ?? round.status;

  const mergeRound = (updated: IChampionshipRound): IChampionshipRound => ({
    ...round,
    ...updated,
    phase: typeof updated.phase === "object" && updated.phase ? updated.phase : round.phase,
  });

  const applyStatus = async (next: RoundStatus) => {
    if (next === round.status) return;
    setSaving(true);
    setPending(next);
    try {
      let updated: IChampionshipRound;
      switch (next) {
        case RoundStatus.SCHEDULED:
          // updated = await scheduleChampionshipRound(round._id);
          break;
        case RoundStatus.IN_PROGRESS:
          updated = await openningChampionshipRound(round._id);
          break;
        case RoundStatus.IN_HOMOLOGATION:
          // updated = await homologateChampionshipRound(round._id);
          break;
        case RoundStatus.FINISHED:
          updated = await finishChampionshipRound(round._id);
          break;
        case RoundStatus.CANCELLED:
          // updated = await cancelChampionshipRound(round._id);
          break;
        default:
          throw new Error("Status de rodada inválido.");
      }
      onRoundUpdated(mergeRound(updated));
      setEditOpen(false);
      toast.success(`Rodada marcada como ${RoundStatusTranslation[next]}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status da rodada.");
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  return (
    <div className="flex min-h-0 items-center justify-center gap-10 overflow-hidden">
      <Button
        type="button"
        variant="secondary"
        className="h-[clamp(1.75rem,10vh,3.5rem)] w-[clamp(1.75rem,10vh,3.5rem)] p-0 [&_svg]:size-[45%]"
        onClick={onPrev}
        aria-label="Rodada anterior"
        disabled={roundIndex <= 0}
      >
        <ChevronLeft className="h-[55%] w-[55%]" />
      </Button>
      <div className="min-w-0 max-w-[18rem] text-center">
        <p className="flex min-h-0 items-center justify-center gap-2 truncate text-[clamp(1rem,4.2vh,1.5rem)] font-black leading-tight tracking-tight">
          {label}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex aspect-square h-[clamp(1.25rem,4vh,1.75rem)] w-auto shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground"
            aria-label="Editar status da rodada"
          >
            <Pencil className="h-[45%] w-[45%]" />
          </button>
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-[clamp(1.75rem,10vh,3.5rem)] w-[clamp(1.75rem,10vh,3.5rem)] p-0 [&_svg]:size-[45%]"
        onClick={onNext}
        aria-label="Próxima rodada"
        disabled={roundIndex >= total - 1}
      >
        <ChevronRight className="h-[55%] w-[55%]" />
      </Button>

      <RoundStatusEditModal
        open={editOpen}
        current={round.status}
        saving={saving}
        pending={pending}
        onClose={() => !saving && setEditOpen(false)}
        onSelect={applyStatus}
      />
    </div>
  );
}
