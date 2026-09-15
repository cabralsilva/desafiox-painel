import { apiRequest } from "@/lib/api";

export type ChatReceiptType = "RECEIVED" | "SEEN";
export type DevicePlatform = "WEB" | "ANDROID" | "IOS";

export type ChatRealtimeEventType = "message.created" | "message.status";

export interface ChatRealtimeMessage {
  _id: string;
  chat: string;
  sender: string;
  content: string;
  status: string;
  sendDateTime: string;
  clientMessageId?: string;
  files: unknown[];
  receivements: { receivedBy: string; receivedDateTime: string }[];
  seens: { seenBy: string; seenDateTime: string }[];
}

export interface ChatRealtimeEvent {
  eventId: string;
  type: ChatRealtimeEventType;
  occurredAt: string;
  correlationId: string;
  chatId: string;
  messageId: string;
  senderId: string;
  status: string;
  channel?: string;
  clientMessageId?: string;
  message: ChatRealtimeMessage;
  contactIds: string[];
  inbox?: boolean;
  claimed?: boolean;
}

export async function enqueueChatMessage(payload: {
  chatId: string;
  content: string;
  clientMessageId: string;
  sendDateTime: string;
}): Promise<{ accepted: boolean; correlationId: string; clientMessageId: string; chatId: string }> {
  const res = await apiRequest("/admin/chat/realtime/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `enqueueChatMessage: ${res.status}`);
  return body;
}

export async function markChatRead(chatId: string): Promise<{ chatId: string; updated: number }> {
  const res = await apiRequest(`/admin/chat/realtime/chats/${encodeURIComponent(chatId)}/read`, {
    method: "POST",
    invalidateOnAuthError: false,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message ?? `markChatRead: ${res.status}`);
  }
  return body;
}

export async function markChatMessagesRead(
  chatId: string,
  messageIds: string[]
): Promise<{ chatId: string; updated: number }> {
  const ids = [...new Set(messageIds.filter(Boolean))];
  if (!ids.length) return { chatId, updated: 0 };
  const res = await apiRequest(`/admin/chat/realtime/chats/${encodeURIComponent(chatId)}/messages/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageIds: ids }),
    invalidateOnAuthError: false,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message ?? `markChatMessagesRead: ${res.status}`);
  }
  return body;
}

export async function enqueueChatReceipts(payload: {
  chatId: string;
  messageIds: string[];
  receipt: ChatReceiptType;
}): Promise<void> {
  const res = await apiRequest("/admin/chat/realtime/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    invalidateOnAuthError: false,
  });
  if (!res.ok && res.status !== 202) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `enqueueChatReceipts: ${res.status}`);
  }
}

export async function upsertDeviceSession(payload: {
  deviceId: string;
  platform: DevicePlatform;
  pushSubscription?: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  } | null;
  active?: boolean;
}): Promise<void> {
  const res = await apiRequest("/admin/chat/realtime/device-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    invalidateOnAuthError: false,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `upsertDeviceSession: ${res.status}`);
  }
}

export async function deactivateDeviceSession(deviceId: string): Promise<void> {
  const res = await apiRequest("/admin/chat/realtime/device-sessions/deactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
    invalidateOnAuthError: false,
  });
  if (!res.ok && res.status !== 401 && res.status !== 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `deactivateDeviceSession: ${res.status}`);
  }
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await apiRequest("/admin/chat/realtime/push/public-key", {
    invalidateOnAuthError: false,
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return typeof body?.publicKey === "string" && body.publicKey ? body.publicKey : null;
}
