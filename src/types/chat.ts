import type { IContact } from "@/types/contact";
import type { IFile } from "@/types/file";

export type ChatMessageStatus = "NOT_SENT" | "SENT" | "RECEIVED" | "SEEN";

/** Recorte de última mensagem retornado no search de chat. */
export interface IChatLastMessage {
  content?: string;
  status?: ChatMessageStatus;
  sendDateTime?: string;
  files?: IFile[];
  sender?: string | IContact;
}

/** Espelha `IChat` de c2-desafiox, com `lastMessage` do lookup da listagem. */
export interface IChat {
  _id?: string;
  id?: string;
  contacts: Array<string | IContact>;
  icon?: IFile;
  name: string;
  lastMessage?: IChatLastMessage | null;
  unseenMessages?: number;
  createdAtDateTime?: string;
  updatedAtDateTime?: string;
}

export type CreateChatPayload = {
  contacts: string[];
  name: string;
};
