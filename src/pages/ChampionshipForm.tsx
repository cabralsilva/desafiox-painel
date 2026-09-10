import { FullScreenPage } from "@/components/FullScreenPage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createChampionship,
  getChampionshipById,
  getChampionshipPhases,
  updateChampionship,
  type CreateChampionshipPayload,
} from "@/lib/api/championships";
import { searchTeams } from "@/lib/api/teams";
import { buildQualifiedsSlots } from "@/lib/championship/buildQualifiedsTeams";
import { GroupMatchMode, GroupMatchModeTranslation, IChampionshipPhase, IQualifiedRule, QualificationMode, QualificationModeTranslation } from "@/types/championship-phase";
import { ModalityEnum } from "@/types/modality";
import { ITeam, MODALITIES, MODALITY_LABELS } from "@/types/team";
import { Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
// import {
//   GROUP_MATCH_MODE_LABELS,
//   PHASE_TYPE_LABELS,
//   QUALIFICATION_MODE_LABELS,
//   type ChampionshipPhase,
//   type GroupMatchMode,
//   type PhaseType,
//   type QualificationMode,
//   type QualifiedRule,
// } from "@/types/championship";
// import { MODALITIES, MODALITY_LABELS, type Team } from "@/types/team";

const defaultQualifiedRule: IQualifiedRule = {
  priority: 1,
  mode: QualificationMode.POSITION_GENERAL,
  label: "Classificação geral",
  position: 1,
  limit: 1,
};

function defaultPhase(order: number): IChampionshipPhase {
  return {
    description: "",
    order,
    // type: PhaseType.PONTOS_CORRIDOS,
    amountSlotsByGroup: 0,
    groups: [{ name: "Grupo", slots: [] }],
    matchRules: { mode: GroupMatchMode.SAME_GROUP, twoLegs: false },
    qualifiedRules: [{ ...defaultQualifiedRule }],
  } as IChampionshipPhase;
}

export default function ChampionshipForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modality, setModality] = useState<ModalityEnum>(ModalityEnum.SOCCER);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [phases, setPhases] = useState<IChampionshipPhase[]>([defaultPhase(0)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assigningSlot, setAssigningSlot] = useState<{ g: number; s: number } | null>(null);

  const totalSteps = 1 + phases.length;
  const currentPhaseIndex = step >= 2 ? step - 2 : -1;
  const currentPhase = currentPhaseIndex >= 0 ? phases[currentPhaseIndex] : null;
  const teamsFiltered = useMemo(
    () => teams.filter((t) => t.modality === modality),
    [teams, modality]
  );

  useEffect(() => {
    searchTeams({ limit: 500 })
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("Não foi possível carregar os times."));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getChampionshipById(id), getChampionshipPhases(id)])
      .then(([champ, phaseList]) => {
        if (cancelled) return;
        setName(champ.name);
        setSlug(champ.slug ?? "");
        setStartDate(champ.startDate ? moment(champ.startDate).format("YYYY-MM-DD") : "");
        setEndDate(champ.endDate ? moment(champ.endDate).format("YYYY-MM-DD") : "");
        setModality(champ.modality);
        setTeamIds(champ.teams?.map((t) => t._id) ?? []);
        const mapped = phaseList;
        setPhases(mapped.length ? mapped : [defaultPhase(0)]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar campeonato."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const setPhase = useCallback((index: number, patch: Partial<IChampionshipPhase>) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }, []);

  // const setPhaseType = (index: number, type: PhaseType) => {
  //   setPhases((prev) =>
  //     prev.map((p, i) => {
  //       if (i !== index) return p;
  //       if (type === "PONTOS-CORRIDOS") {
  //         return { ...p, type, groups: p.groups.slice(0, 1).map((g, gi) => ({ ...g, name: gi === 0 ? "Grupo" : g.name })) };
  //       }
  //       return { ...p, type };
  //     })
  //   );
  // };

  const toggleTeam = (teamId: string) => {
    setTeamIds((prev) => (prev.includes(teamId) ? prev.filter((x) => x !== teamId) : [...prev, teamId]));
  };

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome.";
    if (teamIds.length < 2) next.teamIds = "Selecione ao menos 2 times.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePhase = (p: IChampionshipPhase) => {
    const next: Record<string, string> = {};
    if (!p.description.trim()) next.description = "Informe a descrição da fase.";
    if (!p.groups.length) next.groups = "Adicione ao menos um grupo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (currentPhase && !validatePhase(currentPhase)) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const buildPayload = (): CreateChampionshipPayload => ({
    name: name.trim(),
    slug: slug.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    teams: teamIds,
    modality,
    phases: phases.map((p, i) => ({
      description: p.description.trim(),
      order: i,
      // type: p.type,
      amountSlotsByGroup: p.amountSlotsByGroup,
      groups: p.groups.map((g) => ({
        name: g.name,
        slots: g.slots.map((s) => ({ label: s.label, team: s.team as ITeam })),
      })),
      matchRules: p.matchRules ?? { mode: GroupMatchMode.SAME_GROUP, twoLegs: false },
      qualifiedRules: p.qualifiedRules,
      qualifiedsSlots: buildQualifiedsSlots(p.qualifiedRules, p.groups),
    }) as IChampionshipPhase),
  } as CreateChampionshipPayload);

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPhase && !validatePhase(currentPhase)) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit && id) {
        await updateChampionship(id, {
          name: payload.name,
          slug: payload.slug,
          startDate: payload.startDate,
          endDate: payload.endDate,
          teams: payload.teams,
          modality: payload.modality,
        });
        toast.success("Campeonato atualizado.");
      } else {
        await createChampionship(payload);
        toast.success("Campeonato criado.");
      }
      navigate("/app/campeonatos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const stepLabel = step === 1 ? "Dados do campeonato" : `Fase ${currentPhaseIndex + 1}`;

  if (loading) {
    return (
      <FullScreenPage title={isEdit ? "Editar campeonato" : "Novo campeonato"}>
        <p className="p-8 text-center text-muted-foreground">Carregando...</p>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={`${isEdit ? "Editar" : "Novo"} campeonato — ${stepLabel}`}
      footer={
        <div className="flex gap-3">
          {step > 1 && (
            <Button type="button" variant="secondary" size="lg" className="h-12 flex-1" onClick={() => setStep((s) => s - 1)}>
              Voltar
            </Button>
          )}
          {step < totalSteps ? (
            <Button type="button" variant="accent" size="lg" className="h-12 flex-1" onClick={handleNext}>
              Continuar
            </Button>
          ) : (
            <Button type="button" variant="accent" size="lg" className="h-12 flex-1" disabled={saving} onClick={handleSubmitAll}>
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar campeonato"}
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={step === 1 ? handleNext : handleSubmitAll} className="space-y-5 p-4 md:p-6">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, s) => (
            <div key={s} className={`h-1.5 flex-1 rounded ${s + 1 <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <Field label="Nome *" error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Slug">
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: brasileirao-2026" />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Início">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Fim">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Modalidade">
              <select
                value={modality}
                onChange={(e) => {
                  setModality(e.target.value as ModalityEnum);
                  setTeamIds([]);
                }}
                className="flex h-12 w-full rounded-md border border-input bg-card px-3 text-base"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {MODALITY_LABELS[m]}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label>Times do campeonato *</Label>
                <div className="flex gap-3 text-sm font-semibold">
                  <button type="button" className="text-accent" onClick={() => setTeamIds(teamsFiltered.map((t) => t._id))}>
                    Todos
                  </button>
                  <button type="button" className="text-muted-foreground" onClick={() => setTeamIds([])}>
                    Limpar
                  </button>
                </div>
              </div>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-2">
                {teamsFiltered.map((t) => {
                  const checked = teamIds.includes(t._id);
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => toggleTeam(t._id)}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left ${checked ? "bg-primary/20 ring-1 ring-primary" : "bg-secondary"
                        }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-sm border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-primary"
                          }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="font-semibold">
                        {t.name} {t.shortName ? `(${t.shortName})` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.teamIds && <p className="mt-1 text-sm text-destructive">{errors.teamIds}</p>}
            </div>
          </>
        )}

        {step >= 2 && currentPhase && (
          <PhaseFields
            phase={currentPhase}
            phaseIndex={currentPhaseIndex}
            teams={teamsFiltered.filter((t) => teamIds.includes(t._id))}
            assigningSlot={assigningSlot}
            errors={errors}
            isEdit={isEdit}
            onAssigningSlot={setAssigningSlot}
            onChange={(patch) => setPhase(currentPhaseIndex, patch)}
            // onType={(type) => setPhaseType(currentPhaseIndex, type)}
            onAddPhase={() => {
              setPhases((prev) => [...prev, defaultPhase(prev.length)]);
              setStep(totalSteps + 1);
            }}
            onRemovePhase={
              phases.length > 1
                ? () => {
                  setPhases((prev) => prev.filter((_, i) => i !== currentPhaseIndex));
                  setStep((s) => Math.max(2, s - 1));
                }
                : undefined
            }
          />
        )}
      </form>
    </FullScreenPage>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function PhaseFields({
  phase,
  phaseIndex,
  teams,
  assigningSlot,
  errors,
  isEdit,
  onAssigningSlot,
  onChange,
  // onType,
  onAddPhase,
  onRemovePhase,
}: {
  phase: IChampionshipPhase;
  phaseIndex: number;
  teams: ITeam[];
  assigningSlot: { g: number; s: number } | null;
  errors: Record<string, string>;
  isEdit: boolean;
  onAssigningSlot: (v: { g: number; s: number } | null) => void;
  onChange: (patch: Partial<IChampionshipPhase>) => void;
  // onType: (type: PhaseType) => void;
  onAddPhase: () => void;
  onRemovePhase?: () => void;
}) {
  const slotsPerGroup = phase.amountSlotsByGroup ?? 0;

  const applySlots = (amount: number, groups = phase.groups) => {
    const nextGroups = groups.map((g) => {
      const slots = [...g.slots];
      while (slots.length < amount) slots.push({
        label: `Posição ${slots.length + 1}`, team: null,
        _id: ""
      });
      return { ...g, slots: slots.slice(0, amount) };
    });
    onChange({ amountSlotsByGroup: amount || undefined, groups: nextGroups });
  };

  const setSlotTeam = (g: number, s: number, team: string | null) => {
    const groups = phase.groups.map((group, gi) =>
      gi !== g
        ? group
        : {
          ...group,
          slots: group.slots.map((slot, si) => (si === s ? { ...slot, team } : slot)),
        }
    );
    onChange({ groups });
    onAssigningSlot(null);
  };

  return (
    <div className="space-y-5">
      {isEdit && (
        <p className="rounded-xl border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
          Na edição, fases e jogos existentes não são recriados. Ajuste nome, datas e times; a estrutura da fase fica para a próxima evolução do formulário.
        </p>
      )}
      <Field label="Descrição da fase *" error={errors.description}>
        <Input
          value={phase.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Ex: Fase de grupos"
        />
      </Field>
      {/* <Field label="Tipo da fase">
        <select
          value={phase.type ?? "PONTOS-CORRIDOS"}
          // onChange={(e) => onType(e.target.value as PhaseType)}
          className="flex h-12 w-full rounded-md border border-input bg-card px-3 text-base"
        >
          {(Object.keys(PHASE_TYPE_LABELS) as PhaseType[]).map((t) => (
            <option key={t} value={t}>
              {PHASE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field> */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-bold">Regras de disputa</p>
        <select
          value={phase.matchRules.mode}
          onChange={(e) =>
            onChange({ matchRules: { ...phase.matchRules, mode: e.target.value as GroupMatchMode } })
          }
          className="flex h-12 w-full rounded-md border border-input bg-card px-3 text-base"
        >
          {(Object.values(GroupMatchModeTranslation) as GroupMatchModeTranslation[]).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label className="flex min-h-12 items-center gap-3">
          <Checkbox
            checked={phase.matchRules.twoLegs}
            onCheckedChange={(v) =>
              onChange({ matchRules: { ...phase.matchRules, twoLegs: Boolean(v) } })
            }
          />
          <span className="font-semibold">Ida e volta</span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field label="Slots por grupo">
            <Input
              type="number"
              min={0}
              value={slotsPerGroup || ""}
              onChange={(e) => applySlots(Number(e.target.value) || 0)}
              className="w-32"
            />
          </Field>
          {/* {phase.type !== "PONTOS-CORRIDOS" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onChange({
                  groups: [
                    ...phase.groups,
                    {
                      name: `Grupo ${phase.groups.length + 1}`,
                      slots: Array.from({ length: slotsPerGroup }, (_, i) => ({
                        label: `Posição ${i + 1}`,
                        team: null,
                      })),
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Grupo
            </Button>
          )} */}
        </div>

        {phase.groups.map((group, gi) => (
          <div key={gi} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Input
              value={group.name}
              onChange={(e) => {
                const groups = phase.groups.map((g, i) => (i === gi ? { ...g, name: e.target.value } : g));
                onChange({ groups });
              }}
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {group.slots.map((slot, si) => {
                const team = teams.find((t) => t._id === slot.team);
                const open = assigningSlot?.g === gi && assigningSlot?.s === si;
                return (
                  <div key={si}>
                    <button
                      type="button"
                      onClick={() => onAssigningSlot(open ? null : { g: gi, s: si })}
                      className="flex min-h-14 w-full items-center justify-between rounded-xl bg-secondary px-3 text-left"
                    >
                      <span className="text-xs text-muted-foreground">{slot.label}</span>
                      <span className="font-bold">{team?.shortName ?? team?.name ?? "Toque para definir"}</span>
                    </button>
                    {open && phaseIndex === 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border p-2">
                        <button
                          type="button"
                          className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground"
                          onClick={() => setSlotTeam(gi, si, null)}
                        >
                          Limpar
                        </button>
                        {teams.map((t) => (
                          <button
                            key={t._id}
                            type="button"
                            className="flex min-h-11 w-full rounded-lg px-3 py-2 text-left hover:bg-secondary"
                            onClick={() => setSlotTeam(gi, si, t._id)}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="font-bold">Regras de classificação</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onChange({
                qualifiedRules: [
                  ...phase.qualifiedRules,
                  {
                    ...defaultQualifiedRule,
                    priority: phase.qualifiedRules.length + 1,
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Regra
          </Button>
        </div>
        {phase.qualifiedRules.map((rule, ri) => (
          <div key={ri} className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-3 md:grid-cols-4">
            <Field label="Modo">
              <select
                value={rule.mode}
                onChange={(e) => {
                  const qualifiedRules = phase.qualifiedRules.map((r, i) =>
                    i === ri ? { ...r, mode: e.target.value as QualificationMode } : r
                  );
                  onChange({ qualifiedRules });
                }}
                className="flex h-12 w-full rounded-md border border-input bg-card px-2 text-sm"
              >
                {(Object.values(QualificationModeTranslation)).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Posição">
              <Input
                type="number"
                min={1}
                value={rule.position}
                onChange={(e) => {
                  const qualifiedRules = phase.qualifiedRules.map((r, i) =>
                    i === ri ? { ...r, position: Number(e.target.value) || 1 } : r
                  );
                  onChange({ qualifiedRules });
                }}
              />
            </Field>
            <Field label="Limite">
              <Input
                type="number"
                min={1}
                value={rule.limit}
                onChange={(e) => {
                  const qualifiedRules = phase.qualifiedRules.map((r, i) =>
                    i === ri ? { ...r, limit: Number(e.target.value) || 1 } : r
                  );
                  onChange({ qualifiedRules });
                }}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                className="h-12 text-destructive"
                onClick={() =>
                  onChange({ qualifiedRules: phase.qualifiedRules.filter((_, i) => i !== ri) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!isEdit && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onAddPhase}>
            <Plus className="h-4 w-4" /> Adicionar outra fase
          </Button>
          {onRemovePhase && (
            <Button type="button" variant="ghost" className="text-destructive" onClick={onRemovePhase}>
              Remover esta fase
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
