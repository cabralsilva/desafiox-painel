import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { FullScreenPage } from "@/components/FullScreenPage";
import {
  getChampionshipById,
  getChampionshipClassification,
  getChampionshipPhases
} from "@/lib/api/championships";
import { PhaseTypeTranslation, type IChampionshipPhase } from "@/types/championship-phase";
import { IChampionship } from "@/types/championship";
import { IChampionshipClassification } from "@/types/championship-classification";
import { ITeam } from "@/types/team";
  

export default function ChampionshipTable() {
  const { id } = useParams();
  const [championship, setChampionship] = useState<IChampionship | null>(null);
  const [phases, setPhases] = useState<IChampionshipPhase[]>([]);
  const [rows, setRows] = useState<IChampionshipClassification[]>([]);
  const [phaseId, setPhaseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getChampionshipById(id),
      getChampionshipPhases(id),
      getChampionshipClassification(id),
    ])
      .then(([champ, phaseList, classification]) => {
        if (cancelled) return;
        setChampionship(champ);
        setPhases(phaseList);
        setRows(classification);
        setPhaseId(phaseList[0]?._id ?? "");
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar tabela."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentPhase = phases.find((p) => p._id === phaseId) ?? phases[0];
  // const type = currentPhase ? inferType(currentPhase) : "PONTOS-CORRIDOS";

  const groups = useMemo(() => {
    // const ofPhase = rows.filter((r) => r.phase?._id === (currentPhase?._id ?? ""));
    const map = new Map<string, IChampionshipClassification[]>();
    // for (const row of ofPhase) {
    //   const key = type === "PONTOS-CORRIDOS" ? currentPhase?.description || "Classificação" : row.group || "Geral";
    //   const list = map.get(key) ?? [];
    //   list.push(row);
    //   map.set(key, list);
    // }
    for (const list of map.values()) {
      list.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
    }
    if (map.size === 0 && currentPhase) {
      for (const g of currentPhase.groups) map.set(g.name, []);
    }
    return Array.from(map.entries());
  }, [rows, currentPhase]);

  return (
    <FullScreenPage title={championship ? `Tabela · ${championship.name}` : "Tabela"}>
      {loading ? (
        <p className="p-8 text-center text-muted-foreground">Carregando tabela...</p>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-4 p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {phases.map((p) => {
              const active = p._id === currentPhase?._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setPhaseId(p._id)}
                  className={`h-12 shrink-0 rounded-xl px-4 text-sm font-bold ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {p.description || `Fase ${p.order + 1}`}
                </button>
              );
            })}
          </div>

          {currentPhase && (
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {/* {PhaseTypeTranslation[type]} · {type === "GRUPOS" ? `${groups.length} grupo(s)` : "Tabela única"} */}
            </p>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-2">
            {groups.map(([groupName, list]) => (
              <section key={groupName} className="rounded-2xl border border-border bg-card p-3">
                <h2 className="mb-3 px-1 text-lg font-black">{groupName}</h2>
                {list.length === 0 ? (
                  <p className="px-1 text-sm text-muted-foreground">Sem classificação ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((row, idx) => (
                      <li
                        key={row._id}
                        className="flex min-h-14 items-center gap-3 rounded-xl bg-secondary px-3"
                      >
                        <span className="w-8 text-center text-lg font-black text-muted-foreground">
                          {idx + 1}
                        </span>
                        {(row.team as ITeam)?.image?.url ? (
                          <img src={(row.team as ITeam)?.image?.url} alt={(row.team as ITeam)?.name || ""} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {(row.team as ITeam)?.shortName ?? (row.team as ITeam)?.name?.slice(0, 2)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate font-bold">
                          {(row.team as ITeam)?.shortName ?? (row.team as ITeam)?.name}
                        </span>
                        <span className="text-lg font-black tabular-nums text-highlight">{row.points}</span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {row.wins}V {row.draws}E {row.losses}D · SG {row.goalDifference}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </FullScreenPage>
  );
}
