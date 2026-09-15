import { entityId, mapApiChatMessages, newId } from "@/lib/supportChat";
import type { ChatRealtimeEvent, ChatRealtimeMessage } from "@/lib/api/chatRealtime";
import type { IChat } from "@/types/chat";
import type { IChatMessage } from "@/types/chat-message";
import type { IContact } from "@/types/contact";
import type { IFile } from "@/types/file";
import type { ChatMessage, SupportChat } from "@/types/supportChat";

export function lastAtTime(iso: string): number {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function unreadTotal(chats: SupportChat[]): number {
  return chats.reduce((sum, chat) => sum + (chat.unread > 0 ? chat.unread : 0), 0);
}

export function mergeChatList(prev: SupportChat[], next: SupportChat[]): SupportChat[] {
  return next.map((item) => {
    const current = prev.find((chat) => chat.id === item.id);
    if (!current) return item;
    return {
      ...item,
      lastMessage: item.lastMessage || current.lastMessage,
      lastMessageSenderId: item.lastMessageSenderId || current.lastMessageSenderId,
      lastAt: item.lastAt || current.lastAt,
      phone: current.phone || item.phone,
      contact: current.contact.phone ? current.contact : item.contact,
      messages: current.messages,
      tickets: current.tickets,
      unread: item.unread,
      contactIds: item.contactIds.length ? item.contactIds : current.contactIds,
    };
  });
}

function contactIdsFromChat(chat: IChat): string[] {
  const ids: string[] = [];
  for (const contact of chat.contacts ?? []) {
    const id = typeof contact === "string" ? contact : entityId(contact._id);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function contactIdFromChat(chat: IChat): string | undefined {
  return contactIdsFromChat(chat)[0];
}

function lastMessagePreview(chat: IChat): string {
  const last = chat.lastMessage;
  if (!last) return "";
  const text = last.content?.trim();
  if (text) return text;
  const files = last.files?.length ?? 0;
  if (files === 1) return "Anexo";
  if (files > 1) return `${files} anexos`;
  return "";
}

function senderIdFromLastMessage(chat: IChat): string | undefined {
  const sender = chat.lastMessage?.sender;
  if (!sender) return undefined;
  if (typeof sender === "string") return sender || undefined;
  return entityId(sender._id) || undefined;
}

export function mapListChat(chat: IChat): SupportChat {
  const id = entityId(chat._id) || entityId(chat.id) || newId("chat");
  const contactId = contactIdFromChat(chat);
  return {
    id,
    contactId,
    name: chat.name || "Conversa",
    phone: "",
    iconUrl: chat.icon?.url || undefined,
    unread: chat.unseenMessages ?? 0,
    lastMessage: lastMessagePreview(chat),
    lastMessageSenderId: senderIdFromLastMessage(chat),
    lastAt: chat.lastMessage?.sendDateTime?.toString?.() || "",
    online: false,
    contactIds: contactIdsFromChat(chat),
    contact: {
      phone: "",
      email: "—",
      city: "—",
      accountLabel: "Conta DESAFIOX não vinculada",
      tags: ["WhatsApp"],
    },
    messages: [],
    tickets: [],
  };
}

export function supportChatFromApi(chat: IChat, contact: IContact): SupportChat {
  const now = new Date().toISOString();
  const mapped = mapListChat(chat);
  return {
    ...mapped,
    name: contact.name || mapped.name,
    phone: contact.identifier,
    contactId: entityId(contact._id) || mapped.contactId,
    contactIds: Array.from(new Set([...(mapped.contactIds ?? []), entityId(contact._id)].filter(Boolean))),
    lastMessage: mapped.lastMessage || "Iniciar conversa",
    lastAt: mapped.lastAt || chat.updatedAtDateTime?.toString?.() || chat.createdAtDateTime?.toString?.() || now,
    contact: {
      phone: contact.identifier,
      email: "—",
      city: "—",
      accountLabel: contact.account ? `Conta DESAFIOX ${contact.account}` : "Conta DESAFIOX não vinculada",
      tags: ["WhatsApp"],
    },
  };
}

const MONGO_ID = /^[a-f0-9]{24}$/i;

export function isPersistedMessageId(id?: string): boolean {
  return Boolean(id && MONGO_ID.test(id));
}

export function unreadMessageIds(messages: ChatMessage[], agentContactId: string | null): string[] {
  if (!agentContactId) return [];
  return messages
    .filter((message) =>
      isPersistedMessageId(message.id) &&
      Boolean(message.senderId) &&
      message.senderId !== agentContactId &&
      !message.seenByIds?.includes(agentContactId)
    )
    .map((message) => message.id);
}

export function upsertChatMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const idx = messages.findIndex(
    (message) =>
      message.id === incoming.id ||
      Boolean(incoming.clientMessageId && (message.clientMessageId === incoming.clientMessageId || message.id === incoming.clientMessageId))
  );
  if (idx < 0) return [...messages, incoming];
  const next = [...messages];
  next[idx] = { ...next[idx], ...incoming };
  return next;
}

function dtoToApiMessage(dto: ChatRealtimeMessage): IChatMessage {
  return {
    _id: dto._id,
    chat: dto.chat,
    sender: dto.sender,
    content: dto.content,
    files: (dto.files ?? []) as IFile[],
    status: dto.status as IChatMessage["status"],
    sendDateTime: dto.sendDateTime,
    receivements: (dto.receivements ?? []).map((entry) => ({
      receivedBy: entry.receivedBy,
      receivedDateTime: entry.receivedDateTime as unknown as Date,
    })),
    seens: (dto.seens ?? []).map((entry) => ({
      seenBy: entry.seenBy,
      seenDateTime: entry.seenDateTime as unknown as Date,
    })),
    clientMessageId: dto.clientMessageId,
  } as IChatMessage & { clientMessageId?: string };
}

export function mapRealtimeMessage(
  event: ChatRealtimeEvent,
  chat: SupportChat,
  agentContactId?: string | null
): ChatMessage | null {
  if (!event.message) return null;
  const [mapped] = mapApiChatMessages(
    [dtoToApiMessage({ ...event.message, clientMessageId: event.clientMessageId || event.message.clientMessageId })],
    chat,
    agentContactId
  );
  return mapped ?? null;
}

function stubChatFromEvent(event: ChatRealtimeEvent): SupportChat {
  const preview = event.message?.content?.trim() || "Nova mensagem";
  return {
    id: event.chatId,
    name: "Conversa",
    phone: "",
    unread: 0,
    lastMessage: preview,
    lastMessageSenderId: event.senderId,
    lastAt: event.message?.sendDateTime || event.occurredAt,
    online: false,
    contactIds: event.contactIds ?? [],
    contact: {
      phone: "",
      email: "—",
      city: "—",
      accountLabel: "Conta DESAFIOX não vinculada",
      tags: ["WhatsApp"],
    },
    messages: [],
    tickets: [],
  };
}

export function markChatReadLocal(chat: SupportChat, agentContactId: string | null): SupportChat {
  if (!agentContactId) return { ...chat, unread: 0 };
  return {
    ...chat,
    unread: 0,
    messages: chat.messages.map((message) => {
      if (!message.senderId || message.senderId === agentContactId) return message;
      return {
        ...message,
        receivedByIds: message.receivedByIds?.includes(agentContactId)
          ? message.receivedByIds
          : [...(message.receivedByIds ?? []), agentContactId],
        seenByIds: message.seenByIds?.includes(agentContactId)
          ? message.seenByIds
          : [...(message.seenByIds ?? []), agentContactId],
      };
    }),
  };
}

export function applyRealtimeEvent(
  chats: SupportChat[],
  event: ChatRealtimeEvent,
  agentContactId: string | null,
  activeChatId: string | null
): SupportChat[] {
  const ids = event.contactIds ?? [];
  if (agentContactId && ids.length > 1 && !ids.includes(agentContactId)) {
    return chats.filter((chat) => chat.id !== event.chatId);
  }
  const existing = chats.find((chat) => chat.id === event.chatId) ?? stubChatFromEvent(event);
  const mapped = mapRealtimeMessage(event, existing, agentContactId);
  if (!mapped) return chats;

  const hadMessage = existing.messages.some(
    (message) =>
      message.id === mapped.id ||
      Boolean(mapped.clientMessageId && (message.clientMessageId === mapped.clientMessageId || message.id === mapped.clientMessageId))
  );
  const messages = upsertChatMessage(existing.messages, mapped);
  const fromOther = Boolean(mapped.senderId && mapped.senderId !== agentContactId);
  const isActive = existing.id === activeChatId;
  let unread = existing.unread;
  if (event.type === "message.created" && fromOther && !hadMessage) {
    unread = isActive ? 0 : existing.unread + 1;
  }
  if (isActive) unread = 0;

  const next: SupportChat = {
    ...existing,
    contactIds: event.contactIds?.length ? event.contactIds : existing.contactIds,
    lastMessage:
      event.type === "message.created"
        ? mapped.text || mapped.attachments?.[0]?.name || existing.lastMessage
        : existing.lastMessage,
    lastMessageSenderId:
      event.type === "message.created" ? mapped.senderId || existing.lastMessageSenderId : existing.lastMessageSenderId,
    lastAt: event.type === "message.created" ? mapped.sentAt || existing.lastAt : existing.lastAt,
    unread,
    messages,
  };

  return [next, ...chats.filter((chat) => chat.id !== next.id)];
}
