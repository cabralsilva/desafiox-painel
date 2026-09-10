import { apiRequest } from "@/lib/api";
import type { IPagingResult } from "@/types/paging";
import type { ITeam } from "@/types/team";

export async function searchTeams(params: {
  page?: number;
  limit?: number;
  searchText?: string;
  modality?: string;
}): Promise<IPagingResult<ITeam>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  if (params.modality) sp.set("modality", params.modality);
  sp.set("select", "name,shortName,image,modality");
  const res = await apiRequest(`/team?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchTeams: ${res.status}`);
  return body;
}
