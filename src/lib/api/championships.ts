import { apiRequest } from "@/lib/api";
import { toUTCISO } from "@/lib/dates";
import { IChampionship } from "@/types/championship";
import { IChampionshipClassification } from "@/types/championship-classification";
import { IMatch } from "@/types/championship-match";
import { IChampionshipPhase } from "@/types/championship-phase";
import { IChampionshipRound, RoundStatus } from "@/types/championship-round";
import type { IPagingResult } from "@/types/paging";

const LIST_SELECT =
  "name,slug,startDate,endDate,modality,teams.name,teams.shortName,teams.image";
const LIST_POPULATE = "teams";

// type ApiDoc = Record<string, unknown>;

// function normalizeId(doc: ApiDoc | string | null | undefined): string {
//   if (!doc) return "";
//   if (typeof doc === "string") return doc;
//   return (doc.id ?? doc._id)?.toString?.() ?? "";
// }

// function toTeamRef(raw: unknown): ChampionshipTeam | string | null {
//   if (raw == null) return null;
//   if (typeof raw === "string") return raw;
//   const t = raw as ApiDoc;
//   const id = normalizeId(t);
//   if (!id) return null;
//   if (t.name) {
//     return {
//       id,
//       name: String(t.name),
//       shortName: t.shortName as string | undefined,
//       image: t.image as ChampionshipTeam["image"],
//     };
//   }
//   return id;
// }

// function toChampionship(c: ApiDoc): Championship {
//   const id = normalizeId(c);
//   const teamsRaw = (c.teams ?? []) as unknown[];
//   const teams: ChampionshipTeam[] = [];
//   const teamIds: string[] = [];
//   for (const t of teamsRaw) {
//     const ref = toTeamRef(t);
//     if (!ref) continue;
//     if (typeof ref === "string") teamIds.push(ref);
//     else {
//       teams.push(ref);
//       teamIds.push(ref.id);
//     }
//   }
//   return {
//     id,
//     name: (c.name as string) ?? "",
//     slug: c.slug as string | undefined,
//     startDate: c.startDate ? utcISOToLocalDateString(String(c.startDate)) ?? String(c.startDate) : undefined,
//     endDate: c.endDate ? utcISOToLocalDateString(String(c.endDate)) ?? String(c.endDate) : undefined,
//     teamIds,
//     teams: teams.length ? teams : undefined,
//     modality: (c.modality as Championship["modality"]) ?? "SOCCER",
//   };
// }

export async function searchChampionships(params: {
  page?: number;
  limit?: number;
  searchText?: string;
}): Promise<IPagingResult<IChampionship>> {
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
  return body;
}

export async function getChampionshipById(id: string): Promise<IChampionship> {
  const sp = new URLSearchParams({
    populate: LIST_POPULATE,
    select: LIST_SELECT,
  });
  const res = await apiRequest(`/championship/${encodeURIComponent(id)}?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getChampionshipById: ${res.status}`);
  return body;
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

export async function createChampionship(payload: CreateChampionshipPayload): Promise<IChampionship> {
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
  return body;
}

export async function updateChampionship(
  id: string,
  payload: Partial<CreateChampionshipPayload>
): Promise<IChampionship> {
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
  return body;
}

export async function getChampionshipPhases(championshipId: string): Promise<IChampionshipPhase[]> {
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
  return body.items;
}

export async function getChampionshipRounds(championshipId: string): Promise<IChampionshipRound[]> {
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
  return body.items;
}

export async function getRoundMatches(roundId: string): Promise<IMatch[]> {
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
  return body.items;
}

export async function getChampionshipClassification(
  championshipId: string
): Promise<IChampionshipClassification[]> {
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
  return body.items;
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
): Promise<IMatch> {
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
  return m;
}

export async function updateChampionshipRound(
  id: string,
  payload: Partial<{ status: IChampionshipRound["status"] }>
): Promise<IChampionshipRound> {
  const res = await apiRequest(`/championship-round/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `updateChampionshipRound: ${res.status}`);
  return body;
}

export async function openningChampionshipRound(
  id: string,
): Promise<IChampionshipRound> {
  const res = await apiRequest(`/championship-round/${encodeURIComponent(id)}/openning`, {
    method: "PATCH",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `openningChampionshipRound: ${res.status}`);
  return body;
}

export async function finishChampionshipRound(
  id: string,
): Promise<IChampionshipRound> {
  const res = await apiRequest(`/championship-round/${encodeURIComponent(id)}/finish`, {
    method: "PATCH",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `finishChampionshipRound: ${res.status}`);
  return body;
}



export function scheduleChampionshipRound(id: string) {
  return updateChampionshipRound(id, { status: RoundStatus.SCHEDULED });
}

export function homologateChampionshipRound(id: string) {
  return updateChampionshipRound(id, { status: RoundStatus.IN_HOMOLOGATION });
}

export function cancelChampionshipRound(id: string) {
  return updateChampionshipRound(id, { status: RoundStatus.CANCELLED });
}
