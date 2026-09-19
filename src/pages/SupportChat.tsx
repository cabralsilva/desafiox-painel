import { ChatContactColumn } from "@/components/support-chat/ChatContactColumn";
import { ChatDetailsPanel } from "@/components/support-chat/ChatDetailsPanel";
import { ChatThread } from "@/components/support-chat/ChatThread";
import { NewConversationDialog } from "@/components/support-chat/NewConversationDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChatList } from "@/hooks/useChatList";
import { useSearchParams } from "react-router-dom";
import { lastAtTime, markChatReadLocal, supportChatFromApi, unreadMessageIds } from "@/lib/chatList";
import { enqueueChatMessage, fetchWhatsAppWindow, type WhatsAppSessionWindow } from "@/lib/api/chatRealtime";
import { createChatMessage } from "@/lib/api/chatMessages";
import { fileToApiFile, formatBytes, mapApiChatMessages, newId } from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import type { ChatMessage, SupportTicket } from "@/types/supportChat";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function SupportChat() {
  const { chats, loading, agentContactId, patchChat, upsertChat, reloadChats, setActiveChatId, markMessagesRead } = useChatList();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [waWindow, setWaWindow] = useState<WhatsAppSessionWindow | null>(null);
  const canSend = Boolean(agentContactId);
  const selected = chats.find((c) => c.id === selectedId) ?? null;
  const sessionWindowOpen = Boolean(waWindow?.open);

  useEffect(() => {
    return () => setActiveChatId(null);
  }, [setActiveChatId]);

  useEffect(() => {
    if (!selectedId) {
      setWaWindow(null);
      return;
    }
    let cancelled = false;
    void fetchWhatsAppWindow(selectedId)
      .then((window) => {
        if (!cancelled) setWaWindow(window);
      })
      .catch(() => {
        if (!cancelled) setWaWindow({ open: false, lastCustomerMessageAt: null, expiresAt: null, customerWaId: null });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, selected?.lastAt]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? chats.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q)
        )
      : chats;
    return [...list].sort((a, b) => lastAtTime(b.lastAt) - lastAtTime(a.lastAt));
  }, [chats, search]);

  const selectChat = (id: string) => {
    setSelectedId(id);
    setActiveChatId(id);
    setMobileShowChat(true);
    setComposerFocusKey((key) => key + 1);
    patchChat(id, (chat) => ({ ...chat, unread: 0 }));
  };

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (!chatId) return;
    if (!chats.some((chat) => chat.id === chatId)) return;
    selectChat(chatId);
    const next = new URLSearchParams(searchParams);
    next.delete("chat");
    setSearchParams(next, { replace: true });
  }, [chats, searchParams, setSearchParams]);

  const sendText = async (text: string) => {
    if (!selected) {
      throw new Error("Nenhuma conversa selecionada.");
    }
    if (!sessionWindowOpen) {
      toast.error("A janela de 24h está fechada. Envie um template.");
      throw new Error("Janela de 24h fechada.");
    }
    if (!agentContactId) {
      toast.error("Não há contato vinculado ao usuário logado.");
      throw new Error("Contato do usuário logado não encontrado.");
    }
    const sendDateTime = new Date().toISOString();
    const clientMessageId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      id: clientMessageId,
      clientMessageId,
      author: "agent",
      kind: "text",
      text,
      sentAt: sendDateTime,
      status: "NOT_SENT",
      senderId: agentContactId,
      receivedByIds: [],
      seenByIds: [],
    };
    patchChat(selected.id, (chat) => ({
      ...chat,
      lastMessage: text,
      lastMessageSenderId: agentContactId,
      lastAt: sendDateTime,
      messages: [...chat.messages, optimistic],
    }));
    try {
      await enqueueChatMessage({
        chatId: selected.id,
        content: text,
        clientMessageId,
        sendDateTime,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar mensagem.");
      throw e;
    }
  };

  const sendTemplate = async (templateName: string, templateLanguage: string) => {
    if (!selected) {
      throw new Error("Nenhuma conversa selecionada.");
    }
    if (!agentContactId) {
      toast.error("Não há contato vinculado ao usuário logado.");
      throw new Error("Contato do usuário logado não encontrado.");
    }
    const sendDateTime = new Date().toISOString();
    const clientMessageId = crypto.randomUUID();
    const preview = `[template:${templateName}]`;
    const optimistic: ChatMessage = {
      id: clientMessageId,
      clientMessageId,
      author: "agent",
      kind: "text",
      text: preview,
      sentAt: sendDateTime,
      status: "NOT_SENT",
      senderId: agentContactId,
      receivedByIds: [],
      seenByIds: [],
    };
    patchChat(selected.id, (chat) => ({
      ...chat,
      lastMessage: preview,
      lastMessageSenderId: agentContactId,
      lastAt: sendDateTime,
      messages: [...chat.messages, optimistic],
    }));
    try {
      await enqueueChatMessage({
        chatId: selected.id,
        clientMessageId,
        sendDateTime,
        templateName,
        templateLanguage,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar template.");
      throw e;
    }
  };

  const sendFiles = async (files: File[], kind: "image" | "video" | "file") => {
    if (!selected) {
      throw new Error("Nenhuma conversa selecionada.");
    }
    if (!sessionWindowOpen) {
      toast.error("A janela de 24h está fechada. Envie um template.");
      throw new Error("Janela de 24h fechada.");
    }
    if (!agentContactId) {
      toast.error("Não há contato vinculado ao usuário logado.");
      throw new Error("Contato do usuário logado não encontrado.");
    }
    const sendDateTime = new Date().toISOString();
    try {
      const apiFiles = await Promise.all(Array.from(files).map(fileToApiFile));
      const names = apiFiles.map((file) => file.description).filter(Boolean);
      const content = names.length === 1 ? names[0] : `${names.length} anexos`;
      const created = await createChatMessage({
        chat: selected.id,
        sender: agentContactId,
        content,
        sendDateTime,
        files: apiFiles,
      });
      const [mapped] = mapApiChatMessages([created], selected, agentContactId);
      const localAttachments = apiFiles.map((file, index) => ({
        name: file.description || names[index] || "Anexo",
        sizeLabel: formatBytes(files[index]?.size ?? 0),
        kind,
        url:
          file.url ||
          (file.fileBase64 ? `data:${file.contentType};base64,${file.fileBase64}` : undefined),
      }));
      const attachments = (mapped?.attachments?.length ? mapped.attachments : localAttachments).map(
        (attachment, index) => ({
          ...attachment,
          url: attachment.url || localAttachments[index]?.url,
        })
      );
      const message: ChatMessage = {
        id: mapped?.id || newId("msg"),
        author: mapped?.author ?? "agent",
        kind: mapped?.kind ?? kind,
        text: mapped?.text,
        attachments,
        sentAt: mapped?.sentAt || sendDateTime,
        status: mapped?.status ?? "SENT",
        senderId: mapped?.senderId ?? agentContactId,
        receivedByIds: mapped?.receivedByIds ?? [],
        seenByIds: mapped?.seenByIds ?? [],
      };
      patchChat(selected.id, (chat) => ({
        ...chat,
        lastMessage: message.attachments?.[0]?.name || message.text || "Anexo",
        lastMessageSenderId: agentContactId,
        lastAt: message.sentAt,
        messages: [...chat.messages, message],
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar anexo.");
      throw e;
    }
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <div
        className={cn(
          "h-full min-h-0 w-full shrink-0 lg:w-[22rem]",
          selected && mobileShowChat ? "hidden lg:flex lg:flex-col" : "flex flex-col"
        )}
      >
        <ChatContactColumn
          chats={filtered}
          selectedId={selectedId}
          search={search}
          loading={loading}
          onSearch={setSearch}
          onSelect={selectChat}
          onNewConversation={() => setNewConversationOpen(true)}
          agentContactId={agentContactId}
        />
      </div>

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1",
          selected && mobileShowChat ? "flex" : "hidden lg:flex"
        )}
      >
        {selected ? (
          <ChatThread
            chat={selected}
            onBack={() => setMobileShowChat(false)}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((v) => !v)}
            onSendText={sendText}
            onSendTemplate={sendTemplate}
            onSendFiles={sendFiles}
            composerFocusKey={composerFocusKey}
            canSend={canSend}
            sessionWindowOpen={waWindow == null ? null : waWindow.open}
            agentContactId={agentContactId}
            onMessagesLoaded={(chatId, messages) => {
              const unread = unreadMessageIds(messages, agentContactId);
              patchChat(chatId, (c) => markChatReadLocal({ ...c, messages }, agentContactId));
              markMessagesRead(chatId, unread);
            }}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      {selected && detailsOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            aria-label="Fechar detalhes"
            onClick={() => setDetailsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-40 w-[min(100%,22rem)] lg:static lg:z-auto lg:h-full lg:w-[22rem] lg:shrink-0">
            <ChatDetailsPanel
              chat={selected}
              onClose={() => setDetailsOpen(false)}
              onNewTicket={() => setNewTicketOpen(true)}
            />
          </div>
        </>
      ) : null}

      <NewConversationDialog
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        onStarted={(chat, contact) => {
          const mapped = supportChatFromApi(chat, contact);
          upsertChat(mapped);
          selectChat(mapped.id);
          setNewConversationOpen(false);
          void reloadChats({ silent: true });
        }}
      />

      <NewTicketDialog
        open={newTicketOpen}
        onClose={() => setNewTicketOpen(false)}
        onCreate={(subject, note) => {
          if (!selected) return;
          const now = new Date().toISOString();
          const ticket: SupportTicket = {
            id: newId("tck"),
            protocol: `SUP-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            subject,
            status: "OPEN",
            openedAt: now,
            artifacts: [],
            history: [
              { id: newId("evt"), at: now, author: "agent", text: note || "Ticket de suporte aberto pelo painel." },
            ],
          };
          patchChat(selected.id, (chat) => ({ ...chat, tickets: [ticket, ...chat.tickets] }));
          setNewTicketOpen(false);
        }}
      />
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <MessageCircle className="h-12 w-12 text-accent" />
      <h2 className="text-xl font-black tracking-tight">Chat/Suporte DESAFIOX</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Selecione uma conversa à esquerda para ver o histórico. A integração com a API oficial do WhatsApp entra
        na próxima etapa.
      </p>
    </div>
  );
}

function NewTicketDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, note: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!subject.trim()) {
      setError("Informe o assunto.");
      return;
    }
    onCreate(subject.trim(), note.trim());
    setSubject("");
    setNote("");
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ticket de suporte</DialogTitle>
          <DialogDescription>
            Registro de uma solicitação que precisa de análise. SLA e níveis entram na próxima etapa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Assunto</Label>
            <Input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-note">Nota inicial</Label>
            <Textarea id="ticket-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" className="h-12" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" className="h-12" onClick={submit}>
            Abrir ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
