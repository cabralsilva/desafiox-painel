import { apiRequest } from "@/lib/api";
import type { AccessProfilePayload, IAdminAccessProfile } from "@/types/accessProfile";
import type { IPagingResult } from "@/types/paging";

const LIST_SELECT = "name,roles,active,createdAtDateTime,updatedAtDateTime";

export async function searchAccessProfiles(params: {
  page?: number;
  limit?: number;
  searchText?: string;
}): Promise<IPagingResult<IAdminAccessProfile>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  sp.set("select", LIST_SELECT);
  sp.set("orderBy", "name");
  sp.set("orderSense", "asc");
  const res = await apiRequest(`/admin/access-profile?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchAccessProfiles: ${res.status}`);
  return body;
}

export async function getAccessProfileById(id: string): Promise<IAdminAccessProfile> {
  const sp = new URLSearchParams({ select: LIST_SELECT });
  const res = await apiRequest(`/admin/access-profile/${encodeURIComponent(id)}?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getAccessProfileById: ${res.status}`);
  return body;
}

export async function createAccessProfile(payload: AccessProfilePayload): Promise<IAdminAccessProfile> {
  const res = await apiRequest("/admin/access-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createAccessProfile: ${res.status}`);
  return body;
}

export async function updateAccessProfile(
  id: string,
  payload: AccessProfilePayload
): Promise<IAdminAccessProfile> {
  const res = await apiRequest(`/admin/access-profile/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `updateAccessProfile: ${res.status}`);
  return body;
}

export async function deleteAccessProfile(id: string): Promise<void> {
  const res = await apiRequest(`/admin/access-profile/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `deleteAccessProfile: ${res.status}`);
}
