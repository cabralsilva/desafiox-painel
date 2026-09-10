import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { searchChats } from "@/lib/api/chats";
import { loadSessionContact } from "@/lib/api/auth";
import { mapListChat, mergeChatList, unreadTotal as sumUnread } from "@/lib/chatList";
import { getSessionContact, getSessionContactId } from "@/lib/session";
import type { IContact } from "@/types/contact";
import type { SupportChat } from "@/types/supportChat";
import { toast } from "sonner";

type ChatListContextValue = {
  chats: SupportChat[];
  loading: boolean;
  agentContact: IContact | null;
  agentContactId: string | null;
  unreadTotal: number;
  reloadChats: (opts?: { silent?: boolean }) => Promise<void>;
  patchChat: (id: string, updater: (chat: SupportChat) => SupportChat) => void;
  upsertChat: (chat: SupportChat) => void;
};

const ChatListContext = createContext<ChatListContextValue | null>(null);

export function ChatListProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentContact, setAgentContact] = useState(() => getSessionContact());
  const agentContactId = agentContact?._id?.toString?.() || getSessionContactId();

  useEffect(() => {
    void loadSessionContact().then((contact) => {
      setAgentContact(contact);
      if (!contact && !getSessionContactId()) {
        setLoading(false);
        toast.error("Não há contato vinculado ao usuário logado.");
      }
    });
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

  const unreadTotal = useMemo(() => sumUnread(chats), [chats]);

  const value = useMemo<ChatListContextValue>(
    () => ({
      chats,
      loading,
      agentContact,
      agentContactId,
      unreadTotal,
      reloadChats,
      patchChat,
      upsertChat,
    }),
    [agentContact, agentContactId, chats, loading, patchChat, reloadChats, unreadTotal, upsertChat]
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
