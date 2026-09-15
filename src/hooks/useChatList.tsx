import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { searchChats } from "@/lib/api/chats";
import { enqueueChatReceipts, markChatMessagesRead, type ChatRealtimeEvent } from "@/lib/api/chatRealtime";
import { loadSessionContact } from "@/lib/api/auth";
import { registerChatDeviceSession } from "@/lib/chatPush";
import { applyRealtimeEvent, isPersistedMessageId, mapListChat, markChatReadLocal, mergeChatList, unreadMessageIds, unreadTotal as sumUnread } from "@/lib/chatList";
import { getSessionContact, getSessionContactId } from "@/lib/session";
import { useChatSocket } from "@/hooks/useChatSocket";
import type { IContact } from "@/types/contact";
import type { SupportChat } from "@/types/supportChat";
import { toast } from "sonner";

type ChatListContextValue = {
  chats: SupportChat[];
  loading: boolean;
  agentContact: IContact | null;
  agentContactId: string | null;
  unreadTotal: number;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  reloadChats: (opts?: { silent?: boolean }) => Promise<void>;
  patchChat: (id: string, updater: (chat: SupportChat) => SupportChat) => void;
  upsertChat: (chat: SupportChat) => void;
  markMessagesRead: (chatId: string, messageIds: string[]) => void;
};

const ChatListContext = createContext<ChatListContextValue | null>(null);

export function ChatListProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentContact, setAgentContact] = useState(() => getSessionContact());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [visibilityTick, setVisibilityTick] = useState(0);
  const agentContactId = agentContact?._id?.toString?.() || getSessionContactId();
  const sentReceiptsRef = useRef(new Set<string>());
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  useEffect(() => {
    void loadSessionContact().then((contact) => {
      setAgentContact(contact);
      if (!contact && !getSessionContactId()) {
        setLoading(false);
        toast.error("Não há contato vinculado ao usuário logado.");
      }
    });
  }, []);

  useEffect(() => {
    if (!agentContactId) return;
    void registerChatDeviceSession().catch((error) => {
      console.warn("[chat] falha ao registrar device session", error);
    });
  }, [agentContactId]);

  useEffect(() => {
    const onVisibility = () => setVisibilityTick((tick) => tick + 1);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const reloadChats = useCallback(async (opts?: { silent?: boolean }) => {
    if (!agentContactId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const result = await searchChats({ contactId: agentContactId, page: 1, limit: 50 });
      setChats((prev) => mergeChatList(prev, (result.items ?? []).map(mapListChat)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar conversas.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [agentContactId]);

  useEffect(() => {
    if (!agentContactId) return;
    void reloadChats();
  }, [agentContactId, reloadChats]);

  const patchChat = useCallback((id: string, updater: (chat: SupportChat) => SupportChat) => {
    setChats((prev) => prev.map((chat) => (chat.id === id ? updater(chat) : chat)));
  }, []);

  const upsertChat = useCallback((chat: SupportChat) => {
    setChats((prev) => [
      chat,
      ...prev.filter((item) => item.id !== chat.id && item.contactId !== chat.contactId),
    ]);
  }, []);

  const markMessagesRead = useCallback((chatId: string, messageIds: string[]) => {
    if (!agentContactId) return;
    const ids = [...new Set(messageIds.filter((id) => isPersistedMessageId(id)))].filter((id) => {
      const key = `SEEN:${id}:${agentContactId}`;
      if (sentReceiptsRef.current.has(key)) return false;
      sentReceiptsRef.current.add(key);
      sentReceiptsRef.current.add(`RECEIVED:${id}:${agentContactId}`);
      return true;
    });
    if (!ids.length) return;
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? markChatReadLocal(chat, agentContactId) : chat)));
    void markChatMessagesRead(chatId, ids).catch((error) => {
      console.warn("[chat] falha ao marcar mensagens como vistas", error);
    });
  }, [agentContactId]);

  const onRealtimeEvent = useCallback((event: ChatRealtimeEvent) => {
    const known = chatsRef.current.some((chat) => chat.id === event.chatId);
    const viewing =
      event.chatId === activeChatId &&
      event.senderId !== agentContactId &&
      typeof document !== "undefined" &&
      document.visibilityState === "visible";
    setChats((prev) => applyRealtimeEvent(prev, event, agentContactId, activeChatId));
    if (!known) void reloadChats({ silent: true });
    if (event.type === "message.created" && viewing && event.messageId) {
      markMessagesRead(event.chatId, [event.messageId]);
    }
  }, [activeChatId, agentContactId, markMessagesRead, reloadChats]);

  useChatSocket(Boolean(agentContactId), onRealtimeEvent);

  useEffect(() => {
    if (!activeChatId || !agentContactId) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    const chat = chatsRef.current.find((item) => item.id === activeChatId);
    if (!chat) return;
    markMessagesRead(activeChatId, unreadMessageIds(chat.messages, agentContactId));
  }, [activeChatId, agentContactId, markMessagesRead, visibilityTick]);

  useEffect(() => {
    if (!agentContactId) return;
    const incoming = chats.flatMap((chat) =>
      chat.messages
        .filter((message) => isPersistedMessageId(message.id) && message.senderId && message.senderId !== agentContactId)
        .map((message) => ({ chat, message }))
    );
    const received: Record<string, string[]> = {};
    for (const { chat, message } of incoming) {
      if (chat.id === activeChatId) continue;
      const receiveKey = `RECEIVED:${message.id}:${agentContactId}`;
      if (!message.receivedByIds?.includes(agentContactId) && !sentReceiptsRef.current.has(receiveKey)) {
        received[chat.id] = [...(received[chat.id] ?? []), message.id];
        sentReceiptsRef.current.add(receiveKey);
      }
    }
    const jobs: Promise<void>[] = [];
    for (const [chatId, messageIds] of Object.entries(received)) {
      jobs.push(enqueueChatReceipts({ chatId, messageIds, receipt: "RECEIVED" }));
    }
    if (!jobs.length) return;
    void Promise.all(jobs).catch((error) => {
      console.warn("[chat] falha ao enviar tickets", error);
    });
  }, [activeChatId, agentContactId, chats]);

  const unreadTotal = useMemo(() => sumUnread(chats), [chats]);

  const value = useMemo<ChatListContextValue>(
    () => ({
      chats,
      loading,
      agentContact,
      agentContactId,
      unreadTotal,
      activeChatId,
      setActiveChatId,
      reloadChats,
      patchChat,
      upsertChat,
      markMessagesRead,
    }),
    [activeChatId, agentContact, agentContactId, chats, loading, markMessagesRead, patchChat, reloadChats, unreadTotal, upsertChat]
  );

  return <ChatListContext.Provider value={value}>{children}</ChatListContext.Provider>;
}

export function useChatList() {
  const ctx = useContext(ChatListContext);
  if (!ctx) {
    throw new Error("useChatList deve ser usado dentro de ChatListProvider.");
  }
  return ctx;
}
