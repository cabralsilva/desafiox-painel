import { apiRequest } from "@/lib/api";
import type { IChatMessage } from "@/types/chat-message";
import type { IFile } from "@/types/file";
import type { IPagingResult } from "@/types/paging";

const LIST_SELECT = "content,status,sendDateTime,files,sender,receivements.contact,seens.contact";

export type CreateChatMessagePayload = {
  chat: string;
  sender: string;
  content: string;
  sendDateTime: string;
  files?: IFile[];
};

export async function searchChatMessages(params: {
  chatId: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<IPagingResult<IChatMessage>> {
  const sp = new URLSearchParams();
  sp.set("chat", params.chatId);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  sp.set("populate", "sender,receivements.contact,seens.contact");
  sp.set("select", LIST_SELECT);
  sp.set("orderBy", "sendDateTime");
  sp.set("orderSense", "desc");
  const res = await apiRequest(`/admin/chat/chat-message?${sp.toString()}`, {
    signal: params.signal,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `searchChatMessages: ${res.status}`);
  return body;
}

export async function createChatMessage(payload: CreateChatMessagePayload): Promise<IChatMessage> {
  const res = await apiRequest("/admin/chat/chat-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `createChatMessage: ${res.status}`);
  return body;
}
