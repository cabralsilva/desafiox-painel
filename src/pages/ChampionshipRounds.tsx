import { FullScreenPage } from "@/components/FullScreenPage";
import { MatchFieldEditModal, useSyncedDraft } from "@/components/MatchFieldEditModal";
import { RoundMatchCard } from "@/components/RoundMatchCard";
import { RoundNav } from "@/components/RoundNav";
import { ScoreSide } from "@/components/ScoreSide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getChampionshipById,
  getChampionshipRounds,
  getRoundMatches,
  updateChampionshipMatch
} from "@/lib/api/championships";
import { formatWeekdayDateTimeBR } from "@/lib/dates";
import { IChampionship } from "@/types/championship";
import { MatchStatus, MatchStatusTranslation, type IMatch } from "@/types/championship-match";
import { type IChampionshipRound } from "@/types/championship-round";
import { ITeam } from "@/types/team";
import { Separator } from "@radix-ui/react-select";
import { CalendarIcon, MapPinIcon, MoveHorizontal, Pencil } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export default function ChampionshipRounds() {
  const { id } = useParams();
  const [championship, setChampionship] = useState<IChampionship | null>(null);
  const [rounds, setRounds] = useState<IChampionshipRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<"date" | "location" | null>(null);

  const round = rounds[roundIndex] ?? null;
  const selected = matches.find((m) => m._id === selectedId) ?? matches[0] ?? null;
  const dateOpen = editField === "date";
  const locationOpen = editField === "location";
  const [dateDraft, setDateDraft] = useSyncedDraft(
    dateOpen,
    selected?.matchDateTime ? moment(selected.matchDateTime).format("YYYY-MM-DDTHH:mm") : ""
  );
  const [locationDraft, setLocationDraft] = useSyncedDraft(locationOpen, selected?.location ?? "");

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
    getRoundMatches(round._id)
      .then((list) => {
        if (cancelled) return;
        setMatches(list);
        setSelectedId((prev) => (prev && list.some((m) => m._id === prev) ? prev : list[0]?._id ?? null));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar jogos."));
    return () => {
      cancelled = true;
    };
  }, [round?._id]);

  const patchMatch = useCallback((matchId: string, patch: Partial<IMatch>) => {
    setMatches((prev) => prev.map((m) => (m._id === matchId ? {
      ...m,
      homeScore: patch.homeScore ?? m.homeScore,
      homeScoreTieBreak: patch.homeScoreTieBreak ?? m.homeScoreTieBreak,
      awayScore: patch.awayScore ?? m.awayScore,
      awayScoreTieBreak: patch.awayScoreTieBreak ?? m.awayScoreTieBreak,
      matchDateTime: patch.matchDateTime ?? m.matchDateTime,
      location: patch.location ?? m.location,
      status: patch.status ?? m.status,
    } : { ...m })));
  }, []);

  const bumpScore = (side: "home" | "away", delta: number) => {
    if (!selected) return;
    const key = side === "home" ? "homeScore" : "awayScore";
    const current = selected[key] ?? 0;
    const next = Math.max(0, current + delta);
    patchMatch(selected._id, { [key]: next });
  };

  const saveSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateChampionshipMatch(selected._id, {
        homeScore: selected.homeScore ?? 0,
        awayScore: selected.awayScore ?? 0,
        status: selected.homeScore != null && selected.awayScore != null ? "IN_PROGRESS" : selected.status,
      });
      patchMatch(selected._id, updated);
      toast.success("Placar atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar jogo.");
    } finally {
      setSaving(false);
    }
  };

  const saveDateTime = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateChampionshipMatch(selected._id, {
        matchDateTime: dateDraft || null,
      });
      patchMatch(selected._id, updated);
      setEditField(null);
      toast.success("Data e hora atualizadas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar data.");
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateChampionshipMatch(selected._id, {
        location: locationDraft.trim() || null,
      });
      patchMatch(selected._id, updated);
      setEditField(null);
      toast.success("Local atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar local.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FullScreenPage fillHeight title={championship ? `Rodadas · ${championship.name}` : "Rodadas"}>
      {loading ? (
        <p className="p-8 text-center text-muted-foreground">Carregando rodadas...</p>
      ) : !round ? (
        <p className="p-8 text-center text-muted-foreground">Nenhuma rodada cadastrada.</p>
      ) : (
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,8%)_minmax(0,22%)_minmax(0,50%)_minmax(0,15%)] gap-1 overflow-hidden p-1 sm:gap-2 sm:p-2">
          <RoundNav
            round={round}
            roundIndex={roundIndex}
            total={rounds.length}
            onPrev={() => setRoundIndex((i) => Math.max(0, i - 1))}
            onNext={() => setRoundIndex((i) => Math.min(rounds.length - 1, i + 1))}
            onRoundUpdated={(updated) =>
              setRounds((prev) => prev.map((r) => (r._id === updated._id ? { ...r, status: updated.status } : r)))
            }
          />
          
          <div className="grid min-h-0 grid-rows-[minmax(0,8fr)_minmax(0,2fr)] p-1">
            
            <div className="row flex min-h-0 gap-2 overflow-x-auto overflow-y-hidden scrollbar-width-none">
              {matches.length === 0 && (
                <p className="self-center px-2 text-sm text-muted-foreground">Nenhum jogo nesta rodada.</p>
              )}
              {matches.map((match) => {
                const active = match._id === selected?._id;
                return <RoundMatchCard key={match._id} match={match} active={active} onSelect={setSelectedId} />;
              })}
            </div>
            <div className="flex min-h-0 w-full items-center justify-center">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MoveHorizontal className="h-3 w-3 shrink-0" />
                Deslize para navegar pelos jogos
              </span>
            </div>
          </div>

          {selected ? (
            <section className="grid min-h-0 grid-rows-[minmax(0,80%)_minmax(0,20%)] overflow-hidden rounded-2xl border border-border bg-card px-3 py-1 sm:rounded-3xl">
              <div className="flex min-h-0 items-center justify-around overflow-hidden">
                <ScoreSide
                  slot={selected.slotHome}
                  disabled={selected.status === MatchStatus.FINISHED}
                  name={(selected.slotHome.team as ITeam)?.name || (selected.slotHome.team as ITeam)?.shortName || ""}
                  score={selected.homeScore ?? 0}
                  onMinus={() => bumpScore("home", -1)}
                  onPlus={() => bumpScore("home", 1)}
                />
                <div className="flex w-max max-w-full flex-col items-center text-center">
                  <span className="text-[clamp(1.25rem,4vh,1.875rem)] font-black text-muted-foreground">vs</span>
                </div>
                <ScoreSide
                  slot={selected.slotAway}
                  disabled={selected.status === MatchStatus.FINISHED}
                  name={(selected.slotAway.team as ITeam)?.name || (selected.slotAway.team as ITeam)?.shortName || ""}
                  score={selected.awayScore ?? 0}
                  onMinus={() => bumpScore("away", -1)}
                  onPlus={() => bumpScore("away", 1)}
                />
              </div>
              <div className="grid min-h-0 grid-cols-3 items-center gap-1 overflow-hidden">
                <div className="flex min-w-0 items-center justify-start">
                  <span className="truncate text-[clamp(0.65rem,2vh,1rem)] font-black uppercase tracking-wide text-muted-foreground">
                    Jogo {MatchStatusTranslation[selected.status] ?? selected.status}
                  </span>
                </div>
                <div className="flex min-h-0 min-w-0 items-center justify-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[clamp(0.6rem,1.8vh,0.875rem)] text-muted-foreground">
                    {selected.matchDateTime ? formatWeekdayDateTimeBR(selected.matchDateTime) : "A definir data / hora"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditField("date")}
                    className="flex aspect-square h-[80%] max-h-12 w-auto shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground"
                    aria-label="Editar data e hora"
                  >
                    <Pencil className="h-[45%] w-[45%]" />
                  </button>
                </div>
                <div className="flex min-h-0 min-w-0 items-center justify-end gap-1">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[clamp(0.6rem,1.8vh,0.875rem)] text-muted-foreground">
                    {selected.location || "A definir local"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditField("location")}
                    className="flex aspect-square h-[80%] max-h-12 w-auto shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground"
                    aria-label="Editar local"
                  >
                    <Pencil className="h-[45%] w-[45%]" />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="min-h-0" />
          )}

          <section className="flex min-h-0 items-stretch overflow-hidden rounded-2xl border border-border bg-card p-1">
            <Button
              type="button"
              variant="accent"
              className="h-full min-h-0 w-full text-[clamp(0.8rem,2.2vh,1rem)]"
              disabled={saving || !selected}
              onClick={saveSelected}
            >
              {saving ? "Salvando..." : "Salvar jogo"}
            </Button>
          </section>
        </div>
      )}

      <MatchFieldEditModal
        open={dateOpen}
        title="Data e hora do jogo"
        description="Defina quando a partida acontece."
        saving={saving && dateOpen}
        onClose={() => setEditField(null)}
        onSave={saveDateTime}
      >
        <Label htmlFor="match-datetime">Data / hora</Label>
        <Input
          id="match-datetime"
          type="datetime-local"
          className="mt-2 h-14"
          value={dateDraft}
          onChange={(e) => setDateDraft(e.target.value)}
        />
      </MatchFieldEditModal>

      <MatchFieldEditModal
        open={locationOpen}
        title="Local do jogo"
        description="Estádio, arena ou cidade da partida."
        saving={saving && locationOpen}
        onClose={() => setEditField(null)}
        onSave={saveLocation}
      >
        <Label htmlFor="match-location">Local</Label>
        <Input
          id="match-location"
          className="mt-2 h-14"
          value={locationDraft}
          onChange={(e) => setLocationDraft(e.target.value)}
          placeholder="Estádio / arena"
        />
      </MatchFieldEditModal>
    </FullScreenPage>
  );
}
