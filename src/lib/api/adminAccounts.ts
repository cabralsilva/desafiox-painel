import { apiRequest } from "@/lib/api";
import { toUTCISO } from "@/lib/dates";
import type { AdminAccountPayload, IAdminAccount } from "@/types/adminAccount";
import type { IPagingResult } from "@/types/paging";

const LIST_SELECT =
  "name,emailAccess,phones,active,bornDate,image,adminAccessProfile.name,adminAccessProfile.active,createdAtDateTime";
const LIST_POPULATE = "adminAccessProfile";

export async function searchAdminAccounts(params: {
  page?: number;
  limit?: number;
  searchText?: string;
}): Promise<IPagingResult<IAdminAccount>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  sp.set("select", LIST_SELECT);
  sp.set("populate", LIST_POPULATE);
  sp.set("orderBy", "name");
  sp.set("orderSense", "asc");
  const res = await apiRequest(`/admin/account?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchAdminAccounts: ${res.status}`);
  return body;
}

export async function getAdminAccountById(id: string): Promise<IAdminAccount> {
  const sp = new URLSearchParams({
    select: LIST_SELECT,
    populate: LIST_POPULATE,
  });
  const res = await apiRequest(`/admin/account/${encodeURIComponent(id)}?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getAdminAccountById: ${res.status}`);
  return body;
}

function toRequestBody(payload: AdminAccountPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.name,
    emailAccess: payload.emailAccess,
    phones: payload.phones,
    active: payload.active,
    adminAccessProfile: payload.adminAccessProfile,
    bornDate: payload.bornDate ? toUTCISO(payload.bornDate) : null,
  };
  if (payload.passwordAccess) body.passwordAccess = payload.passwordAccess;
  return body;
}

export async function createAdminAccount(payload: AdminAccountPayload): Promise<IAdminAccount> {
  const res = await apiRequest("/admin/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(payload)),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createAdminAccount: ${res.status}`);
  return body;
}

export async function updateAdminAccount(
  id: string,
  payload: AdminAccountPayload
): Promise<IAdminAccount> {
  const res = await apiRequest(`/admin/account/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(payload)),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `updateAdminAccount: ${res.status}`);
  return body;
}

export async function deleteAdminAccount(id: string): Promise<void> {
  const res = await apiRequest(`/admin/account/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `deleteAdminAccount: ${res.status}`);
}
