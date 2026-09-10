import { apiRequest } from "@/lib/api";
import type { CreateChatPayload, IChat } from "@/types/chat";
import type { IPagingResult } from "@/types/paging";

const LIST_SELECT =
  "icon,contacts,name,lastMessage.content,lastMessage.sendDateTime,lastMessage.files,lastMessage.status,lastMessage.sender,unseenMessages";

export async function searchChats(params: {
  contactId: string;
  page?: number;
  limit?: number;
  searchText?: string;
}): Promise<IPagingResult<IChat>> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.searchText) sp.set("searchText", params.searchText);
  sp.set("select", LIST_SELECT);
  const res = await apiRequest(
    `/admin/chat/chat/${encodeURIComponent(params.contactId)}/search?${sp.toString()}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchChats: ${res.status}`);
  return body;
}

export async function createChat(payload: CreateChatPayload): Promise<IChat> {
  const res = await apiRequest("/admin/chat/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createChat: ${res.status}`);
  return body;
}
