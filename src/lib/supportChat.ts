import type { ChatMessageStatus } from "@/types/chat";
import type { IChatMessage } from "@/types/chat-message";
import type { IContact } from "@/types/contact";
import type { IFile } from "@/types/file";
import type {
  ChatAttachment,
  ChatDeliveryReceipt,
  ChatMessage,
  ChatMessageAuthor,
  ChatMessageKind,
  SupportChat,
} from "@/types/supportChat";

export function formatChatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatChatListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return formatChatClock(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Ontem";
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatChatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return "Hoje";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
}

/** Separador do histórico: Hoje, Ontem, Terça, 08/09. */
export function formatChatHistoryDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays > 1 && diffDays < 7) {
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
    const short = weekday.split("-")[0] ?? weekday;
    return short.charAt(0).toUpperCase() + short.slice(1);
  }
  if (d.getFullYear() !== now.getFullYear()) {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function messageDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function chatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const AVATAR_TONES = [
  "bg-primary/25 text-foreground",
  "bg-accent/20 text-accent",
  "bg-highlight/20 text-highlight",
  "bg-success/20 text-success",
];

export function avatarTone(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return AVATAR_TONES[n % AVATAR_TONES.length];
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function kindFromFile(file: File): ChatMessageKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

export async function fileToApiFile(file: File): Promise<IFile> {
  const fileBase64 = await readFileAsBase64(file);
  const format = file.name.split(".").pop()?.toLowerCase() || "";
  return {
    contentType: file.type || "application/octet-stream",
    format,
    description: file.name,
    url: "",
    fileBase64,
  };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export function entityId(value?: string | { toString?: () => string }): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toString?.() || "";
}

function toIso(value: Date | string | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function kindFromApiFile(file: IFile): Exclude<ChatMessageKind, "text"> {
  const type = file.contentType || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  const format = (file.format || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(format)) return "image";
  if (["mp4", "mov", "webm", "m4v"].includes(format)) return "video";
  return "file";
}

function senderId(sender: IChatMessage["sender"]): string {
  if (typeof sender === "string") return sender;
  return entityId((sender as IContact | undefined)?._id);
}

function senderName(sender: IChatMessage["sender"]): string {
  if (typeof sender === "string") return "";
  return sender?.name?.trim() || "";
}

function messageAuthor(item: IChatMessage, chat: SupportChat, agentContactId?: string | null): ChatMessageAuthor {
  const id = senderId(item.sender);
  if (agentContactId && id && id === agentContactId) return "agent";
  if (chat.contactId && id && id === chat.contactId) return "client";
  const name = senderName(item.sender);
  if (name && name.toLowerCase() === chat.name.trim().toLowerCase()) return "client";
  if (id || name) return "agent";
  return "client";
}

function mapApiFile(file: IFile): ChatAttachment {
  const kind = kindFromApiFile(file);
  const dataUrl =
    !file.url && file.fileBase64 && file.contentType
      ? `data:${file.contentType};base64,${file.fileBase64}`
      : undefined;
  return {
    name: file.description || "Anexo",
    sizeLabel: file.format || "",
    kind,
    url: file.url || dataUrl,
  };
}

function isAutoAttachmentCaption(text: string, attachments: ChatAttachment[]): boolean {
  const trimmed = text.trim();
  if (!trimmed || !attachments.length) return false;
  if (/^\d+\s+anexos$/i.test(trimmed)) return true;
  return attachments.some((item) => item.name === trimmed);
}

function receiptContactId(contact: string | IContact): string {
  if (typeof contact === "string") return contact;
  return entityId(contact._id);
}


export function messageDeliveryReceipt(message: {
  status?: ChatMessageStatus | string;
  senderId?: string;
  receivedByIds?: string[];
  seenByIds?: string[];
}, chatContactIds: string[]): ChatDeliveryReceipt {
  const status = String(message.status || "NOT_SENT");
  if (status === "NOT_SENT") return "not_sent";
  if (status === "SENT") return "sent";
  if (status === "RECEIVED") return "received";
  if (status === "SEEN") return "read";
  return "not_sent";
}

/** API vem em desc; o histórico visual é cronológico (mais recente junto do compositor). */
function receiptEntryId(entry: {
  contact?: string | IContact;
  receivedBy?: string | IContact;
  seenBy?: string | IContact;
}): string {
  if (entry.receivedBy) return receiptContactId(entry.receivedBy);
  if (entry.seenBy) return receiptContactId(entry.seenBy);
  if (entry.contact) return receiptContactId(entry.contact);
  return "";
}

export function mapApiChatMessages(
  items: IChatMessage[],
  chat: SupportChat,
  agentContactId?: string | null,
): ChatMessage[] {
  return [...items].reverse().map((item) => {
    const attachments = (item.files ?? []).map(mapApiFile);
    const text = item.content?.trim() || undefined;
    const clientMessageId = (item as IChatMessage & { clientMessageId?: string }).clientMessageId;
    return {
      id: entityId(item._id) || clientMessageId || newId("msg"),
      author: messageAuthor(item, chat, agentContactId),
      kind: attachments[0]?.kind ?? "text",
      text: text && !isAutoAttachmentCaption(text, attachments) ? text : undefined,
      attachments,
      sentAt: toIso(item.sendDateTime),
      status: item.status as ChatMessageStatus | undefined,
      senderId: senderId(item.sender) || undefined,
      receivedByIds: (item.receivements ?? [])
        .map((entry) => receiptEntryId(entry))
        .filter(Boolean),
      seenByIds: (item.seens ?? [])
        .map((entry) => receiptEntryId(entry))
        .filter(Boolean),
      clientMessageId,
    };
  });
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const CHAT_EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "🤩", "😇",
  "🙂", "😉", "😢", "😭", "😡", "🤔", "🙌", "👏",
  "👍", "👎", "🔥", "❤️", "⚽", "🏆", "🎯", "✅",
];
