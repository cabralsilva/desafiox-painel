import { apiRequest } from "@/lib/api";
import type { CreateContactPayload, IContact } from "@/types/contact";
import type { IPagingResult } from "@/types/paging";

export async function searchContacts(params: {
  page?: number;
  limit?: number;
  searchText?: string;
  adminAccount?: string;
}): Promise<IPagingResult<IContact>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  if (params.adminAccount) sp.set("adminAccount", params.adminAccount);
  if (!params.adminAccount) {
    sp.set("select", "name,identifier,profilePhoto,account,createdAtDateTime");
    sp.set("orderBy", "name");
    sp.set("orderSense", "asc");
  }
  const res = await apiRequest(`/admin/chat/contact?${sp.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchContacts: ${res.status}`);
  return body;
}

export async function fetchContactByAdminAccount(adminAccountId: string): Promise<IContact | null> {
  const result = await searchContacts({
    adminAccount: adminAccountId,
    page: 1,
    limit: 1,
  });
  return result.items?.[0] ?? null;
}

export async function createContact(payload: CreateContactPayload): Promise<IContact> {
  const res = await apiRequest("/admin/chat/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createContact: ${res.status}`);
  return body;
}
