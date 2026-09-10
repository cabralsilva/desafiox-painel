import type { IChat } from "@/types/chat";
import type { IContact } from "@/types/contact";
import type { SupportChat } from "@/types/supportChat";
import { entityId, newId } from "@/lib/supportChat";

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
