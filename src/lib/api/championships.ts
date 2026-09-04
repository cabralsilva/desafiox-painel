import { apiRequest } from "@/lib/api";
import { toUTCISO, utcISOToLocalDateString, utcISOToLocalDateTimeString } from "@/lib/dates";
import type { Championship, ChampionshipPhase, ChampionshipTeam } from "@/types/championship";
import type { IPagingResult } from "@/types/paging";
import type { Team } from "@/types/team";

const LIST_SELECT =
  "name,slug,startDate,endDate,modality,teams.name,teams.shortName,teams.image";
const LIST_POPULATE = "teams";

type ApiDoc = Record<string, unknown>;

function normalizeId(doc: ApiDoc | string | null | undefined): string {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  return (doc.id ?? doc._id)?.toString?.() ?? "";
}

function toTeamRef(raw: unknown): ChampionshipTeam | string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  const t = raw as ApiDoc;
  const id = normalizeId(t);
  if (!id) return null;
  if (t.name) {
    return {
      id,
      name: String(t.name),
      shortName: t.shortName as string | undefined,
      image: t.image as ChampionshipTeam["image"],
    };
  }
  return id;
}

function toChampionship(c: ApiDoc): Championship {
  const id = normalizeId(c);
  const teamsRaw = (c.teams ?? []) as unknown[];
  const teams: ChampionshipTeam[] = [];
  const teamIds: string[] = [];
  for (const t of teamsRaw) {
    const ref = toTeamRef(t);
    if (!ref) continue;
    if (typeof ref === "string") teamIds.push(ref);
    else {
      teams.push(ref);
      teamIds.push(ref.id);
    }
  }
  return {
    id,
    name: (c.name as string) ?? "",
    slug: c.slug as string | undefined,
    startDate: c.startDate ? utcISOToLocalDateString(String(c.startDate)) ?? String(c.startDate) : undefined,
    endDate: c.endDate ? utcISOToLocalDateString(String(c.endDate)) ?? String(c.endDate) : undefined,
    teamIds,
    teams: teams.length ? teams : undefined,
    modality: (c.modality as Championship["modality"]) ?? "SOCCER",
  };
}

export async function searchChampionships(params: {
  page?: number;
  limit?: number;
  searchText?: string;
}): Promise<IPagingResult<Championship>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  sp.set("select", LIST_SELECT);
  sp.set("populate", LIST_POPULATE);
  sp.set("orderBy", "startDate");
  sp.set("orderSense", "desc");
  const res = await apiRequest(`/championship?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchChampionships: ${res.status}`);
  const items = (body.items ?? []) as ApiDoc[];
  return {
    items: items.map(toChampionship),
    paging: body.paging ?? {
      total: items.length,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      totalPages: 1,
      startIndex: 0,
      endIndex: items.length,
    },
  };
}

export async function getChampionshipById(id: string): Promise<Championship> {
  const sp = new URLSearchParams({
    populate: LIST_POPULATE,
    select: LIST_SELECT,
  });
  const res = await apiRequest(`/championship/${encodeURIComponent(id)}?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getChampionshipById: ${res.status}`);
  return toChampionship(body as ApiDoc);
}

export interface CreateChampionshipPayload {
  name: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  teams: string[];
  modality: string;
  phases: Array<{
    description: string;
    order: number;
    type?: string;
    amountSlotsByGroup?: number;
    groups: Array<{
      name: string;
      slots: Array<{ label: string; team: string | null }>;
    }>;
    matchRules: { mode: string; twoLegs: boolean };
    qualifiedRules: Array<{
      priority: number;
      mode: string;
      position: number;
      limit: number;
      label?: string;
    }>;
    qualifiedsSlots?: Array<{
      label: string;
      team: string | null;
      priority: number;
      position: number;
      group: string;
    }>;
  }>;
}

export async function createChampionship(payload: CreateChampionshipPayload): Promise<Championship> {
  const requestBody = {
    ...payload,
    startDate: payload.startDate ? toUTCISO(payload.startDate) : undefined,
    endDate: payload.endDate ? toUTCISO(payload.endDate) : undefined,
  };
  const res = await apiRequest("/championship", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createChampionship: ${res.status}`);
  return toChampionship(body as ApiDoc);
}

export async function updateChampionship(
  id: string,
  payload: Partial<CreateChampionshipPayload>
): Promise<Championship> {
  const bodyPayload: Record<string, unknown> = { ...payload };
  if (typeof bodyPayload.startDate === "string") bodyPayload.startDate = toUTCISO(bodyPayload.startDate);
  if (typeof bodyPayload.endDate === "string") bodyPayload.endDate = toUTCISO(bodyPayload.endDate);
  const res = await apiRequest(`/championship/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `updateChampionship: ${res.status}`);
  return toChampionship(body as ApiDoc);
}

export interface PhaseDetail {
  id: string;
  description: string;
  order: number;
  type?: string;
  amountSlotsByGroup?: number;
  groups: Array<{ name: string; slots: Array<{ label: string; team: string | null }> }>;
  matchRules?: { mode: string; twoLegs: boolean };
  qualifiedRules: Array<{
    priority: number;
    mode: string;
    position: number;
    limit: number;
    label?: string;
  }>;
}

export interface RoundDetail {
  id: string;
  phaseDescription?: string;
  phaseId: string;
  roundIndexInPhase: number;
  globalRoundIndex: number;
  label?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface SlotDetail {
  label: string;
  team: string | null;
  teamName?: string;
}

export interface MatchDetail {
  id: string;
  number: number;
  roundId: string;
  group?: string;
  slotHome: SlotDetail;
  slotAway: SlotDetail;
  homeScore?: number;
  awayScore?: number;
  homeScoreTieBreak?: number;
  awayScoreTieBreak?: number;
  status: string;
  scheduledAt?: string;
  matchDateTime?: string;
  location?: string;
}

function toSlot(raw: unknown): SlotDetail {
  const s = (raw ?? {}) as ApiDoc;
  const teamRaw = s.team ?? s.teams;
  let team: string | null = null;
  let teamName: string | undefined;
  if (typeof teamRaw === "string") team = teamRaw;
  else if (teamRaw && typeof teamRaw === "object") {
    const t = teamRaw as ApiDoc;
    team = normalizeId(t) || null;
    teamName = (t.shortName as string) ?? (t.name as string);
  }
  return { label: (s.label as string) ?? "", team, teamName };
}

export async function getChampionshipPhases(championshipId: string): Promise<PhaseDetail[]> {
  const sp = new URLSearchParams({
    championship: championshipId,
    limit: "50",
    select:
      "description,order,type,amountSlotsByGroup,groups,matchRules,qualifiedRules,qualifiedsSlots",
    populate: "groups.slots.team",
    orderBy: "order",
    orderSense: "asc",
  });
  const res = await apiRequest(`/championship-phase?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getChampionshipPhases: ${res.status}`);
  const items: ApiDoc[] = body.items ?? [];
  return items
    .map((p) => ({
      id: normalizeId(p),
      description: (p.description as string) ?? "",
      order: (p.order as number) ?? 0,
      type: p.type as string | undefined,
      amountSlotsByGroup: p.amountSlotsByGroup as number | undefined,
      groups: ((p.groups as ApiDoc[]) ?? []).map((g) => ({
        name: (g.name as string) ?? "",
        slots: ((g.slots as ApiDoc[]) ?? []).map((s) => {
          const t = s.team;
          const teamId =
            t == null ? null : typeof t === "string" ? t : normalizeId(t as ApiDoc) || null;
          return { label: (s.label as string) ?? "", team: teamId };
        }),
      })),
      matchRules: p.matchRules as PhaseDetail["matchRules"],
      qualifiedRules: (p.qualifiedRules as PhaseDetail["qualifiedRules"]) ?? [],
    }))
    .sort((a, b) => a.order - b.order);
}

export async function getChampionshipRounds(championshipId: string): Promise<RoundDetail[]> {
  const sp = new URLSearchParams({
    championship: championshipId,
    limit: "200",
    select: "phase,roundIndexInPhase,globalRoundIndex,label,status,startDate,endDate",
    populate: "phase",
    orderBy: "globalRoundIndex",
    orderSense: "asc",
  });
  const res = await apiRequest(`/championship-round?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getChampionshipRounds: ${res.status}`);
  const items: ApiDoc[] = body.items ?? [];
  return items
    .map((r) => {
      const phase = r.phase as ApiDoc | string | undefined;
      const phaseId = typeof phase === "object" && phase ? normalizeId(phase) : String(phase ?? "");
      const phaseDescription =
        typeof phase === "object" && phase ? (phase.description as string | undefined) : undefined;
      return {
        id: normalizeId(r),
        phaseId,
        phaseDescription,
        roundIndexInPhase: (r.roundIndexInPhase as number) ?? 0,
        globalRoundIndex: (r.globalRoundIndex as number) ?? 0,
        label: r.label as string | undefined,
        status: (r.status as string) ?? "SCHEDULED",
        startDate: utcISOToLocalDateString(r.startDate as string) ?? (r.startDate as string | undefined),
        endDate: utcISOToLocalDateString(r.endDate as string) ?? (r.endDate as string | undefined),
      };
    })
    .sort((a, b) => a.globalRoundIndex - b.globalRoundIndex);
}

export async function getRoundMatches(roundId: string): Promise<MatchDetail[]> {
  const sp = new URLSearchParams({
    round: roundId,
    limit: "100",
    populate: "slotHome.team,slotAway.team",
    select:
      "number,round,group,slotHome,slotAway,homeScore,awayScore,homeScoreTieBreak,awayScoreTieBreak,status,scheduledAt,matchDateTime,location",
    orderBy: "number",
    orderSense: "asc",
  });
  const res = await apiRequest(`/championship-match?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getRoundMatches: ${res.status}`);
  const items: ApiDoc[] = body.items ?? [];
  return items
    .map((m) => {
      const dateTime = m.matchDateTime ?? m.scheduledAt;
      return {
        id: normalizeId(m),
        number: (m.number as number) ?? 0,
        roundId: normalizeId((m.round as ApiDoc) ?? m.round as string) || String(m.round ?? ""),
        group: m.group as string | undefined,
        slotHome: toSlot(m.slotHome),
        slotAway: toSlot(m.slotAway),
        homeScore: m.homeScore as number | undefined,
        awayScore: m.awayScore as number | undefined,
        homeScoreTieBreak: m.homeScoreTieBreak as number | undefined,
        awayScoreTieBreak: m.awayScoreTieBreak as number | undefined,
        status: (m.status as string) ?? "PENDING",
        scheduledAt: m.scheduledAt as string | undefined,
        matchDateTime: dateTime != null ? utcISOToLocalDateTimeString(String(dateTime)) : undefined,
        location: m.location as string | undefined,
      };
    })
    .sort((a, b) => a.number - b.number);
}

export interface ClassificationRow {
  id: string;
  phaseId: string;
  phaseDescription?: string;
  group: string;
  teamId: string | null;
  teamName: string;
  teamShortName?: string;
  teamImageUrl?: string;
  matchesPlayed: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export async function getChampionshipClassification(
  championshipId: string
): Promise<ClassificationRow[]> {
  const sp = new URLSearchParams({
    limit: "500",
    populate: "team,phase",
    select:
      "group,points,wins,draws,losses,matchesPlayed,goalsFor,goalsAgainst,goalDifference,team.name,team.shortName,team.image,phase.description,phase.order,phase.type",
  });
  const res = await apiRequest(
    `/championship/${encodeURIComponent(championshipId)}/classification?${sp.toString()}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getChampionshipClassification: ${res.status}`);
  const items: ApiDoc[] = body.items ?? [];
  return items.map((row) => {
    const team = row.team as ApiDoc | string | undefined;
    const phase = row.phase as ApiDoc | string | undefined;
    const teamObj = typeof team === "object" && team ? team : null;
    const phaseObj = typeof phase === "object" && phase ? phase : null;
    return {
      id: normalizeId(row),
      phaseId: phaseObj ? normalizeId(phaseObj) : String(phase ?? ""),
      phaseDescription: phaseObj?.description as string | undefined,
      group: (row.group as string) ?? "",
      teamId: teamObj ? normalizeId(teamObj) : typeof team === "string" ? team : null,
      teamName: (teamObj?.name as string) ?? "—",
      teamShortName: teamObj?.shortName as string | undefined,
      teamImageUrl: (teamObj?.image as { url?: string } | undefined)?.url,
      matchesPlayed: (row.matchesPlayed as number) ?? 0,
      points: (row.points as number) ?? 0,
      wins: (row.wins as number) ?? 0,
      draws: (row.draws as number) ?? 0,
      losses: (row.losses as number) ?? 0,
      goalsFor: (row.goalsFor as number) ?? 0,
      goalsAgainst: (row.goalsAgainst as number) ?? 0,
      goalDifference: (row.goalDifference as number) ?? 0,
    };
  });
}

export async function updateChampionshipMatch(
  id: string,
  payload: Partial<{
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    matchDateTime: string | null;
    location: string | null;
  }>
): Promise<MatchDetail> {
  const body: Record<string, unknown> = { ...payload };
  if (typeof body.matchDateTime === "string" && body.matchDateTime) {
    body.matchDateTime = toUTCISO(body.matchDateTime);
  }
  const res = await apiRequest(`/championship-match/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const m = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(m?.message ?? `updateChampionshipMatch: ${res.status}`);
  const dateTime = m.matchDateTime ?? m.scheduledAt;
  return {
    id: normalizeId(m),
    number: (m.number as number) ?? 0,
    roundId: normalizeId((m.round as ApiDoc) ?? (m.round as string)) || String(m.round ?? ""),
    group: m.group as string | undefined,
    slotHome: toSlot(m.slotHome),
    slotAway: toSlot(m.slotAway),
    homeScore: m.homeScore as number | undefined,
    awayScore: m.awayScore as number | undefined,
    homeScoreTieBreak: m.homeScoreTieBreak as number | undefined,
    awayScoreTieBreak: m.awayScoreTieBreak as number | undefined,
    status: (m.status as string) ?? "PENDING",
    scheduledAt: m.scheduledAt as string | undefined,
    matchDateTime: dateTime != null ? utcISOToLocalDateTimeString(String(dateTime)) : undefined,
    location: m.location as string | undefined,
  };
}

export function phasesToForm(phases: PhaseDetail[]): ChampionshipPhase[] {
  return phases.map((p) => ({
    id: p.id,
    description: p.description,
    order: p.order,
    type: (p.type as ChampionshipPhase["type"]) ?? inferPhaseType(p),
    amountSlotsByGroup: p.amountSlotsByGroup,
    groups: p.groups.map((g) => ({
      name: g.name,
      slots: g.slots.map((s) => ({ label: s.label, team: s.team })),
    })),
    matchRules: {
      mode: (p.matchRules?.mode as ChampionshipPhase["matchRules"]["mode"]) ?? "SAME_GROUP",
      twoLegs: p.matchRules?.twoLegs ?? false,
    },
    qualifiedRules: p.qualifiedRules.map((r) => ({
      priority: r.priority,
      mode: r.mode as ChampionshipPhase["qualifiedRules"][number]["mode"],
      position: r.position,
      limit: r.limit,
      label: r.label,
    })),
  }));
}

function inferPhaseType(p: PhaseDetail): ChampionshipPhase["type"] {
  if (p.groups.length > 1) return "GRUPOS";
  if ((p.amountSlotsByGroup ?? 0) <= 2 && p.groups.length <= 1) return "MATA-MATA";
  return "PONTOS-CORRIDOS";
}

export type { Team };
