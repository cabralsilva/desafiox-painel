import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { FullScreenPage } from "@/components/FullScreenPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getChampionshipById,
  getChampionshipRounds,
  getRoundMatches,
  updateChampionshipMatch,
  type MatchDetail,
  type RoundDetail,
} from "@/lib/api/championships";
import { MATCH_STATUS_LABELS, ROUND_STATUS_LABELS } from "@/types/championship";
import type { Championship } from "@/types/championship";
import { cn } from "@/lib/utils";

function teamLabel(slot: MatchDetail["slotHome"]) {
  return slot.teamName || slot.label || "A definir";
}

export default function ChampionshipRounds() {
  const { id } = useParams();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [rounds, setRounds] = useState<RoundDetail[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const round = rounds[roundIndex] ?? null;
  const selected = matches.find((m) => m.id === selectedId) ?? matches[0] ?? null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getChampionshipById(id), getChampionshipRounds(id)])
      .then(([champ, list]) => {
        if (cancelled) return;
        setChampionship(champ);
        setRounds(list);
        const idx = list.findIndex((r) => r.status !== "FINISHED");
        setRoundIndex(idx >= 0 ? idx : Math.max(0, list.length - 1));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar rodadas."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!round) {
      setMatches([]);
      setSelectedId(null);
      return;
    }
    let cancelled = false;
    getRoundMatches(round.id)
      .then((list) => {
        if (cancelled) return;
        setMatches(list);
        setSelectedId((prev) => (prev && list.some((m) => m.id === prev) ? prev : list[0]?.id ?? null));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar jogos."));
    return () => {
      cancelled = true;
    };
  }, [round?.id]);

  const patchMatch = useCallback((matchId: string, patch: Partial<MatchDetail>) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...patch } : m)));
  }, []);

  const bumpScore = (side: "home" | "away", delta: number) => {
    if (!selected) return;
    const key = side === "home" ? "homeScore" : "awayScore";
    const current = selected[key] ?? 0;
    const next = Math.max(0, current + delta);
    patchMatch(selected.id, { [key]: next });
  };

  const saveSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateChampionshipMatch(selected.id, {
        homeScore: selected.homeScore ?? 0,
        awayScore: selected.awayScore ?? 0,
        matchDateTime: selected.matchDateTime || null,
        location: selected.location || null,
        status: selected.homeScore != null && selected.awayScore != null ? "IN_PROGRESS" : selected.status,
      });
      patchMatch(selected.id, updated);
      toast.success("Jogo atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar jogo.");
    } finally {
      setSaving(false);
    }
  };

  const roundLabel = round
    ? round.label ?? `Rodada ${(round.globalRoundIndex ?? roundIndex) + 1}`
    : "Rodadas";

  return (
    <FullScreenPage title={championship ? `Rodadas · ${championship.name}` : "Rodadas"}>
      {loading ? (
        <p className="p-8 text-center text-muted-foreground">Carregando rodadas...</p>
      ) : !round ? (
        <p className="p-8 text-center text-muted-foreground">Nenhuma rodada cadastrada.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="h-14 w-14 p-0"
              disabled={roundIndex <= 0}
              onClick={() => setRoundIndex((i) => Math.max(0, i - 1))}
              aria-label="Rodada anterior"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
            <div className="min-w-[12rem] text-center">
              <p className="text-2xl font-black tracking-tight">{roundLabel}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {round.phaseDescription ? `${round.phaseDescription} · ` : ""}
                {ROUND_STATUS_LABELS[round.status] ?? round.status}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="h-14 w-14 p-0"
              disabled={roundIndex >= rounds.length - 1}
              onClick={() => setRoundIndex((i) => Math.min(rounds.length - 1, i + 1))}
              aria-label="Próxima rodada"
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {matches.length === 0 && (
              <p className="px-2 text-sm text-muted-foreground">Nenhum jogo nesta rodada.</p>
            )}
            {matches.map((match) => {
              const active = match.id === selected?.id;
              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedId(match.id)}
                  className={cn(
                    "flex min-h-[5.5rem] min-w-[13rem] shrink-0 flex-col justify-center rounded-2xl border px-4 py-3 text-left",
                    active ? "border-primary bg-primary/15" : "border-border bg-card"
                  )}
                >
                  {match.group && (
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {match.group}
                    </span>
                  )}
                  <span className="truncate text-sm font-bold">{teamLabel(match.slotHome)}</span>
                  <span className="text-xs font-black tabular-nums text-highlight">
                    {match.homeScore ?? 0} × {match.awayScore ?? 0}
                  </span>
                  <span className="truncate text-sm font-bold">{teamLabel(match.slotAway)}</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <section className="flex min-h-[220px] flex-1 items-center justify-around rounded-3xl border border-border bg-card px-4 py-6">
                <ScoreSide
                  name={teamLabel(selected.slotHome)}
                  score={selected.homeScore ?? 0}
                  onMinus={() => bumpScore("home", -1)}
                  onPlus={() => bumpScore("home", 1)}
                />
                <span className="px-2 text-3xl font-black text-muted-foreground">×</span>
                <ScoreSide
                  name={teamLabel(selected.slotAway)}
                  score={selected.awayScore ?? 0}
                  onMinus={() => bumpScore("away", -1)}
                  onPlus={() => bumpScore("away", 1)}
                />
              </section>

              <section className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Data / hora</Label>
                  <Input
                    type="datetime-local"
                    value={selected.matchDateTime ?? ""}
                    onChange={(e) => patchMatch(selected.id, { matchDateTime: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={selected.location ?? ""}
                    onChange={(e) => patchMatch(selected.id, { location: e.target.value })}
                    placeholder="Estádio / arena"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="accent"
                    size="lg"
                    className="h-12 w-full"
                    disabled={saving}
                    onClick={saveSelected}
                  >
                    {saving ? "Salvando..." : "Salvar jogo"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground md:col-span-3">
                  Status: {MATCH_STATUS_LABELS[selected.status] ?? selected.status}
                </p>
              </section>
            </>
          )}
        </div>
      )}
    </FullScreenPage>
  );
}

function ScoreSide({
  name,
  score,
  onMinus,
  onPlus,
}: {
  name: string;
  score: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
      <p className="max-w-full truncate text-center text-base font-black md:text-xl">{name}</p>
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" className="h-14 w-14 p-0" onClick={onMinus} aria-label="Diminuir">
          <Minus className="h-7 w-7" />
        </Button>
        <span className="min-w-[3rem] text-center text-5xl font-black tabular-nums text-highlight md:text-6xl">
          {score}
        </span>
        <Button type="button" variant="secondary" className="h-14 w-14 p-0" onClick={onPlus} aria-label="Adicionar">
          <Plus className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
