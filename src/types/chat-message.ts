import { IChat } from "./chat";
import { IContact } from "./contact";
import { IFile } from "./file";

export declare enum StatusChatMessage {
  NOT_SENT = "NOT_SENT",
  SENT = "SENT",
  RECEIVED = "RECEIVED",
  SEEN = "SEEN"
}

export declare enum StatusChatMessageTranslation {
  NOT_SENT = "Não enviado",
  SENT = "Enviado",
  RECEIVED = "Recebido",
  SEEN = "Visto"
}

export declare enum TypeOfMessageNotication {
  CHAT_MESSAGE = "CHAT_MESSAGE",
  RECEIVED = "RECEIVED",
  SEEN = "SEEN"
}

export declare enum TypeOfMessageNoticationTranslation {
  CHAT_MESSAGE = "Mensagem de chat",
  RECEIVED = "Mensagem recebida",
  SEEN = "Mensagem vista"
}

export interface IChatMessage {
  _id?: string;
  chat?: string | IChat;
  sender: string | IContact;
  category?: string;
  content: string;
  files: IFile[];
  status: StatusChatMessage;
  sendDateTime: Date | string;
  receivements?: {
    receivedBy: string | IContact;
    receivedDateTime: Date;
  }[];
  seens?: {
    seenBy: string | IContact;
    seenDateTime: Date;
  }[];
  type?: TypeOfMessageNotication;
}