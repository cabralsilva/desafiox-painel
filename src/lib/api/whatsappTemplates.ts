import { apiRequest } from "@/lib/api";
import type { IPagingResult } from "@/types/paging";
import type { IWhatsAppTemplate } from "@/types/whatsapp-template";

export async function searchWhatsAppTemplates(params?: {
  page?: number;
  limit?: number;
  status?: string;
  searchText?: string;
}): Promise<IPagingResult<IWhatsAppTemplate>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 100));
  sp.set("orderBy", "name");
  sp.set("orderSense", "asc");
  if (params?.status) sp.set("status", params.status);
  if (params?.searchText) sp.set("searchText", params.searchText);
  const res = await apiRequest(`/admin/whatsapp-template?${sp.toString()}`, {
    invalidateOnAuthError: false,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchWhatsAppTemplates: ${res.status}`);
  return body;
}

export async function getWhatsAppTemplate(id: string): Promise<IWhatsAppTemplate> {
  const res = await apiRequest(`/admin/whatsapp-template/${encodeURIComponent(id)}`, {
    invalidateOnAuthError: false,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `getWhatsAppTemplate: ${res.status}`);
  return body;
}

export async function createWhatsAppTemplate(payload: Partial<IWhatsAppTemplate>): Promise<IWhatsAppTemplate> {
  const res = await apiRequest("/admin/whatsapp-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createWhatsAppTemplate: ${res.status}`);
  return body;
}

export async function updateWhatsAppTemplate(
  id: string,
  payload: Partial<IWhatsAppTemplate>
): Promise<IWhatsAppTemplate> {
  const res = await apiRequest(`/admin/whatsapp-template/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `updateWhatsAppTemplate: ${res.status}`);
  return body;
}

export async function deleteWhatsAppTemplate(id: string): Promise<void> {
  const res = await apiRequest(`/admin/whatsapp-template/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `deleteWhatsAppTemplate: ${res.status}`);
  }
}

export async function syncWhatsAppTemplates(): Promise<{ synced: number; markedDeleted: number; totalFromWaba: number }> {
  const res = await apiRequest("/admin/whatsapp-template/sync", {
    method: "POST",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `syncWhatsAppTemplates: ${res.status}`);
  return body;
}
