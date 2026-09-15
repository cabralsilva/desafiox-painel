import type { ChatMessageStatus } from "@/types/chat";

export type ChatMessageKind = "text" | "image" | "video" | "file";
export type ChatMessageAuthor = "client" | "agent";

export interface ChatAttachment {
  name: string;
  sizeLabel: string;
  kind: Exclude<ChatMessageKind, "text">;
  url?: string;
}

export type ChatDeliveryReceipt = "not_sent" | "sent" | "received" | "read";

export interface ChatMessage {
  id: string;
  author: ChatMessageAuthor;
  kind: ChatMessageKind;
  text?: string;
  attachments?: ChatAttachment[];
  sentAt: string;
  status?: ChatMessageStatus;
  senderId?: string;
  receivedByIds?: string[];
  seenByIds?: string[];
  clientMessageId?: string;
}

export interface SupportTicketArtifact {
  id: string;
  name: string;
  kind: "image" | "video" | "file";
  sizeLabel: string;
}

export interface SupportTicketEvent {
  id: string;
  at: string;
  author: "client" | "agent" | "system";
  text: string;
}

export type SupportTicketStatus = "OPEN" | "IN_REVIEW" | "WAITING_CLIENT" | "RESOLVED";

export interface SupportTicket {
  id: string;
  protocol: string;
  subject: string;
  status: SupportTicketStatus;
  openedAt: string;
  artifacts: SupportTicketArtifact[];
  history: SupportTicketEvent[];
}

export interface SupportContact {
  phone: string;
  email: string;
  city: string;
  accountLabel: string;
  tags: string[];
}

export interface SupportChat {
  id: string;
  contactId?: string;
  name: string;
  phone: string;
  iconUrl?: string;
  unread: number;
  lastMessage: string;
  lastMessageSenderId?: string;
  lastAt: string;
  online: boolean;
  contactIds: string[];
  contact: SupportContact;
  messages: ChatMessage[];
  tickets: SupportTicket[];
}

export const SUPPORT_TICKET_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em análise",
  WAITING_CLIENT: "Aguardando cliente",
  RESOLVED: "Resolvido",
};
