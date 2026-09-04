import { apiRequest } from "@/lib/api";
import type { IPagingResult } from "@/types/paging";
import type { Team } from "@/types/team";

type ApiTeam = Partial<Team> & { _id?: string; id?: string };

function toTeam(t: ApiTeam): Team {
  const id = t.id ?? t._id?.toString?.() ?? String(t._id);
  return {
    id,
    name: t.name ?? "",
    shortName: t.shortName,
    image: t.image,
    logoUrl: t.image?.url ?? t.logoUrl,
    modality: t.modality ?? "SOCCER",
  };
}

export async function searchTeams(params: {
  page?: number;
  limit?: number;
  searchText?: string;
  modality?: string;
}): Promise<IPagingResult<Team>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  if (params.modality) sp.set("modality", params.modality);
  sp.set("select", "name,shortName,image,modality");
  const res = await apiRequest(`/team?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchTeams: ${res.status}`);
  const items = (body.items ?? []) as ApiTeam[];
  return {
    items: items.map(toTeam),
    paging: body.paging ?? {
      total: items.length,
      page: params.page ?? 1,
      limit: params.limit ?? items.length,
      totalPages: 1,
      startIndex: 0,
      endIndex: items.length,
    },
  };
}
