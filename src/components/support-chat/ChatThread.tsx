import { ChatAvatar } from "@/components/support-chat/ChatAvatar";
import { ChatComposer } from "@/components/support-chat/ChatComposer";
import { DownloadFileConfirmDialog } from "@/components/support-chat/DownloadFileConfirmDialog";
import { MediaLightbox } from "@/components/support-chat/MediaLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { searchChatMessages } from "@/lib/api/chatMessages";
import {
  formatChatClock,
  formatChatHistoryDayLabel,
  mapApiChatMessages,
  messageDayKey,
  messageDeliveryReceipt,
} from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import type { ChatDeliveryReceipt, ChatMessage, SupportChat } from "@/types/supportChat";
import { Check, CheckCheck, ChevronLeft, Clock, FileText, ImageIcon, Loader2, PanelRight, Play, Video } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MESSAGE_PAGE_SIZE = 50;
const PULL_THRESHOLD = 50;

function pagingHasMore(result: { items?: unknown[]; paging?: { page?: number; totalPages?: number } }): boolean {
  const page = Number(result.paging?.page);
  const totalPages = Number(result.paging?.totalPages);
  if (Number.isFinite(page) && Number.isFinite(totalPages) && totalPages > 0) {
    return page < totalPages;
  }
  return (result.items?.length ?? 0) >= MESSAGE_PAGE_SIZE;
}

export function ChatThread({
  chat,
  onBack,
  detailsOpen,
  onToggleDetails,
  onSendText,
  onSendTemplate,
  onSendFiles,
  composerFocusKey,
  onMessagesLoaded,
  canSend,
  sessionWindowOpen,
  agentContactId,
}: {
  chat: SupportChat;
  onBack?: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onSendText: (text: string) => void | Promise<void>;
  onSendTemplate: (templateName: string, templateLanguage: string) => void | Promise<void>;
  onSendFiles: (files: File[], kind: "image" | "video" | "file") => void | Promise<void>;
  composerFocusKey?: string | number;
  onMessagesLoaded: (chatId: string, messages: ChatMessage[]) => void;
  canSend: boolean;
  sessionWindowOpen: boolean | null;
  agentContactId?: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [lightbox, setLightbox] = useState<{
    items: { kind: "image" | "video"; url: string; name: string }[];
    index: number;
  } | null>(null);
  const chatRef = useRef(chat);
  const onMessagesLoadedRef = useRef(onMessagesLoaded);
  const agentContactIdRef = useRef(agentContactId);
  const loadingRef = useRef(loading);
  const loadingOlderRef = useRef(loadingOlder);
  const hasMoreRef = useRef(hasMore);
  const pageRef = useRef(page);
  const pullDistanceRef = useRef(pullDistance);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const prevChatIdRef = useRef(chat.id);
  const prevFirstMessageIdRef = useRef(chat.messages[0]?.id);
  const olderAbortRef = useRef<AbortController | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const wheelPullRef = useRef(0);
  const loadOlderRef = useRef<() => void>(() => {});
  chatRef.current = chat;
  onMessagesLoadedRef.current = onMessagesLoaded;
  agentContactIdRef.current = agentContactId;
  loadingRef.current = loading;
  loadingOlderRef.current = loadingOlder;
  hasMoreRef.current = hasMore;
  pageRef.current = page;
  pullDistanceRef.current = pullDistance;

  const loadOlder = useCallback(async () => {
    if (loadingRef.current || loadingOlderRef.current || !hasMoreRef.current) return;
    const chatId = chatRef.current.id;
    const nextPage = pageRef.current + 1;
    olderAbortRef.current?.abort();
    const ac = new AbortController();
    olderAbortRef.current = ac;
    setLoadingOlder(true);
    setPullDistance(0);
    try {
      const result = await searchChatMessages({
        chatId,
        page: nextPage,
        limit: MESSAGE_PAGE_SIZE,
        signal: ac.signal,
      });
      if (ac.signal.aborted || chatRef.current.id !== chatId) return;
      const older = mapApiChatMessages(result.items ?? [], chatRef.current, agentContactIdRef.current);
      const existing = chatRef.current.messages;
      const existingIds = new Set(existing.map((message) => message.id));
      const uniqueOlder = older.filter((message) => !existingIds.has(message.id));
      if (uniqueOlder.length) {
        pendingScrollRestoreRef.current = scrollRef.current?.scrollHeight ?? 0;
        onMessagesLoadedRef.current(chatId, [...uniqueOlder, ...existing]);
      }
      setPage(result.paging?.page ?? nextPage);
      setHasMore(pagingHasMore(result));
    } catch (e) {
      if (ac.signal.aborted) return;
      pendingScrollRestoreRef.current = null;
      toast.error(e instanceof Error ? e.message : "Erro ao carregar mensagens anteriores.");
    } finally {
      if (!ac.signal.aborted) setLoadingOlder(false);
    }
  }, []);
  loadOlderRef.current = () => {
    void loadOlder();
  };

  useEffect(() => {
    const ac = new AbortController();
    olderAbortRef.current?.abort();
    olderAbortRef.current = ac;
    pendingScrollRestoreRef.current = null;
    touchStartYRef.current = null;
    wheelPullRef.current = 0;
    setLoading(true);
    setLoadingOlder(false);
    setPage(1);
    setHasMore(false);
    setPullDistance(0);
    void searchChatMessages({ chatId: chat.id, page: 1, limit: MESSAGE_PAGE_SIZE, signal: ac.signal })
      .then((result) => {
        onMessagesLoadedRef.current(
          chat.id,
          mapApiChatMessages(result.items ?? [], chatRef.current, agentContactIdRef.current)
        );
        setPage(result.paging?.page ?? 1);
        setHasMore(pagingHasMore(result));
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        toast.error(e instanceof Error ? e.message : "Erro ao buscar mensagens.");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => {
      ac.abort();
      if (olderAbortRef.current !== ac) olderAbortRef.current?.abort();
    };
  }, [chat.id]);

  useLayoutEffect(() => {
    const restoreFrom = pendingScrollRestoreRef.current;
    const container = scrollRef.current;
    if (restoreFrom == null || !container) return;
    pendingScrollRestoreRef.current = null;
    container.scrollTop = container.scrollHeight - restoreFrom;
  }, [chat.messages]);

  const firstMessageId = chat.messages[0]?.id;
  const lastMessageId = chat.messages[chat.messages.length - 1]?.id;

  useEffect(() => {
    const chatChanged = prevChatIdRef.current !== chat.id;
    const prepended = !chatChanged && Boolean(prevFirstMessageIdRef.current) && firstMessageId !== prevFirstMessageIdRef.current;
    prevChatIdRef.current = chat.id;
    prevFirstMessageIdRef.current = firstMessageId;
    if (prepended || loading) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.id, chat.messages.length, firstMessageId, lastMessageId, loading]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (event: TouchEvent) => {
      if (!hasMoreRef.current || loadingOlderRef.current || loadingRef.current) return;
      if (el.scrollTop > 0) return;
      touchStartYRef.current = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartYRef.current == null) return;
      if (el.scrollTop > 0) {
        touchStartYRef.current = null;
        setPullDistance(0);
        return;
      }
      const dy = event.touches[0].clientY - touchStartYRef.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      if (event.cancelable) event.preventDefault();
      setPullDistance(Math.min(96, dy * 0.55));
    };

    const onTouchEnd = () => {
      if (touchStartYRef.current == null) return;
      touchStartYRef.current = null;
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        loadOlderRef.current();
      } else {
        setPullDistance(0);
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!hasMoreRef.current || loadingOlderRef.current || loadingRef.current) return;
      if (el.scrollTop > 0) {
        wheelPullRef.current = 0;
        if (pullDistanceRef.current) setPullDistance(0);
        return;
      }
      if (event.deltaY >= 0) {
        wheelPullRef.current = 0;
        if (pullDistanceRef.current) setPullDistance(0);
        return;
      }
      wheelPullRef.current += -event.deltaY;
      setPullDistance(Math.min(96, wheelPullRef.current * 0.45));
      if (wheelPullRef.current >= 80) {
        wheelPullRef.current = 0;
        loadOlderRef.current();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const showSkeleton = loading && chat.messages.length === 0;
  const showLoadOlder = !showSkeleton && chat.messages.length > 0 && (hasMore || loadingOlder || pullDistance > 0);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-2 py-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary lg:hidden"
            aria-label="Voltar para conversas"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleDetails}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-secondary/60"
        >
          <ChatAvatar name={chat.name} />
          <span className="min-w-0">
            <span className="block truncate font-black">{chat.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {chat.online ? "online" : chat.phone}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-secondary",
            detailsOpen && "ring-1 ring-accent"
          )}
          aria-label={detailsOpen ? "Recolher detalhes" : "Abrir detalhes"}
        >
          <PanelRight className="h-5 w-5" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6">
        {showLoadOlder ? (
          <LoadOlderHeader
            hasMore={hasMore}
            loading={loadingOlder}
            pullDistance={pullDistance}
            onLoad={() => void loadOlder()}
          />
        ) : null}
        {showSkeleton ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-px w-full" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-16 w-2/3" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : chat.messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p>
        ) : (
          chat.messages.map((message, index) => {
            const showDay =
              index === 0 || messageDayKey(message.sentAt) !== messageDayKey(chat.messages[index - 1].sentAt);
            return (
              <div key={message.id}>
                {showDay ? <ChatDaySeparator label={formatChatHistoryDayLabel(message.sentAt)} /> : null}
                <MessageBubble
                  message={message}
                  contactIds={chat.contactIds}
                  onOpenMedia={setLightbox}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        onSendText={onSendText}
        onSendTemplate={onSendTemplate}
        onSendFiles={onSendFiles}
        focusKey={composerFocusKey}
        canSend={canSend}
        sessionWindowOpen={sessionWindowOpen}
      />
      {lightbox ? (
        <MediaLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((current) => (current ? { ...current, index } : current))}
        />
      ) : null}
    </div>
  );
}

function LoadOlderHeader({
  hasMore,
  loading,
  pullDistance,
  onLoad,
}: {
  hasMore: boolean;
  loading: boolean;
  pullDistance: number;
  onLoad: () => void;
}) {
  const pullHeight = pullDistance;
  return (
    <div className="mb-3">
      {pullHeight > 0 ? (
        <div className="flex items-center justify-center overflow-hidden text-muted-foreground" style={{ height: pullHeight }}>
          <Loader2
            className={cn("h-5 w-5", (loading || pullDistance >= PULL_THRESHOLD) && "animate-spin")}
          />
        </div>
      ) : null}
      {hasMore ? (
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className="mx-auto flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold hover:bg-secondary/80 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Carregando..." : "Carregar mensagens anteriores"}
        </button>
      ) : null}
    </div>
  );
}

function ChatDaySeparator({ label }: { label: string }) {
  if (!label) return null;
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[11px] font-semibold tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const RECEIPT_LABEL: Record<ChatDeliveryReceipt, string> = {
  not_sent: "Não enviada",
  sent: "Enviada",
  received: "Recebida",
  read: "Lida",
};

function MessageReceiptIcon({
  message,
  contactIds,
}: {
  message: ChatMessage;
  contactIds: string[];
}) {
  const receipt = messageDeliveryReceipt(message, contactIds);
  const label = RECEIPT_LABEL[receipt];
  const iconClass = cn("h-3.5 w-3.5 shrink-0", receipt === "read" ? "text-success" : "text-muted-foreground");

  return (
    <span className="inline-flex" aria-label={label} title={label}>
      {receipt === "not_sent" ? (
        <Clock className={iconClass} />
      ) : receipt === "sent" ? (
        <Check className={iconClass} />
      ) : (
        <CheckCheck className={iconClass} />
      )}
    </span>
  );
}

function MessageBubble({
  message,
  contactIds,
  onOpenMedia,
}: {
  message: ChatMessage;
  contactIds: string[];
  onOpenMedia: (media: {
    items: { kind: "image" | "video"; url: string; name: string }[];
    index: number;
  }) => void;
}) {
  const outgoing = message.author === "agent";
  const attachments = message.attachments ?? [];
  const media = attachments.filter((item) => item.kind === "image" || item.kind === "video");
  const files = attachments.filter((item) => item.kind === "file");
  const mediaItems = media
    .filter((item): item is typeof item & { url: string; kind: "image" | "video" } =>
      Boolean(item.url) && (item.kind === "image" || item.kind === "video")
    )
    .map((item) => ({ kind: item.kind, url: item.url, name: item.name }));
  const visibleMedia = media.slice(0, 4);
  const extraCount = Math.max(0, media.length - 4);

  const openMediaAt = (attachmentIndex: number) => {
    const attachment = media[attachmentIndex];
    if (!attachment?.url) return;
    const mediaIndex = mediaItems.findIndex(
      (item) => item.url === attachment.url && item.name === attachment.name
    );
    onOpenMedia({ items: mediaItems, index: mediaIndex >= 0 ? mediaIndex : 0 });
  };

  return (
    <div className={cn("mb-2 flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(90%,28rem)] rounded-2xl px-3 py-2 text-sm shadow-soft",
          outgoing ? "rounded-br-md bg-primary/25" : "rounded-bl-md bg-secondary"
        )}
      >
        {visibleMedia.length ? (
          <div className={cn("mb-2 grid gap-1", visibleMedia.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {visibleMedia.map((attachment, index) => (
              <AttachmentPreview
                key={`${attachment.name}-${index}`}
                kind={attachment.kind}
                name={attachment.name}
                sizeLabel=""
                url={attachment.url}
                compact={visibleMedia.length > 1}
                hideCaption={visibleMedia.length > 1}
                overflowLabel={index === visibleMedia.length - 1 && extraCount > 0 ? `+${extraCount}` : undefined}
                onOpenMedia={
                  attachment.url ? () => openMediaAt(index) : undefined
                }
              />
            ))}
          </div>
        ) : null}
        {files.length ? (
          <div className="mb-2 space-y-1">
            {files.map((attachment, index) => (
              <FileDownloadRow
                key={`${attachment.name}-${index}`}
                name={attachment.name}
                sizeLabel={attachment.sizeLabel}
                url={attachment.url}
              />
            ))}
          </div>
        ) : null}
        {message.text ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>{formatChatClock(message.sentAt)}</span>
          {outgoing ? <MessageReceiptIcon message={message} contactIds={contactIds} /> : null}
        </p>
      </div>
    </div>
  );
}

function AttachmentPreview({
  kind,
  name,
  sizeLabel,
  url,
  compact,
  hideCaption,
  overflowLabel,
  onOpenMedia,
}: {
  kind: "image" | "video" | "file";
  name: string;
  sizeLabel: string;
  url?: string;
  compact?: boolean;
  hideCaption?: boolean;
  overflowLabel?: string;
  onOpenMedia?: () => void;
}) {
  const height = compact ? "h-28" : "h-36";
  if (kind === "image") {
    return (
      <div className="overflow-hidden rounded-xl bg-background/40">
        {url ? (
          <button
            type="button"
            className="relative block w-full"
            onClick={onOpenMedia}
            aria-label={overflowLabel ? `Abrir galeria (${overflowLabel})` : "Abrir imagem em tela cheia"}
          >
            <img src={url} alt="" className={cn("w-full object-cover", height)} />
            {overflowLabel ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-black text-white shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]">
                {overflowLabel}
              </span>
            ) : null}
          </button>
        ) : (
          <div className={cn("relative flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/20", height)}>
            <ImageIcon className="h-10 w-10 text-foreground/80" />
            {overflowLabel ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-black text-white">
                {overflowLabel}
              </span>
            ) : null}
          </div>
        )}
        {hideCaption ? null : (
          <p className="truncate px-2 py-1 text-xs text-muted-foreground">
            {name}
            {sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
        )}
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div className="overflow-hidden rounded-xl bg-background/40">
        {url ? (
          <button
            type="button"
            className="relative block w-full"
            onClick={onOpenMedia}
            aria-label={overflowLabel ? `Abrir galeria (${overflowLabel})` : "Abrir vídeo em tela cheia"}
          >
            <video src={url} className={cn("pointer-events-none w-full object-cover", height)} muted playsInline />
            {overflowLabel ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-black text-white shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]">
                {overflowLabel}
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
                  <Play className="h-6 w-6 fill-white text-white" />
                </span>
              </span>
            )}
          </button>
        ) : (
          <div className={cn("relative flex items-center justify-center bg-gradient-to-br from-secondary to-muted", height)}>
            <Video className="h-10 w-10 text-foreground/80" />
            {overflowLabel ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-black text-white">
                {overflowLabel}
              </span>
            ) : null}
          </div>
        )}
        {hideCaption ? null : (
          <p className="truncate px-2 py-1 text-xs text-muted-foreground">
            {name}
            {sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
        )}
      </div>
    );
  }
  return (
    <FileDownloadRow name={name} sizeLabel={sizeLabel} url={url} />
  );
}

function FileDownloadRow({
  name,
  sizeLabel,
  url,
}: {
  name: string;
  sizeLabel: string;
  url?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const download = () => {
    if (!url) {
      toast.error("Arquivo indisponível para download.");
      setConfirmOpen(false);
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "arquivo";
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl bg-background/40 px-3 py-2 text-left hover:bg-secondary/70"
        onClick={() => {
          if (!url) {
            toast.error("Arquivo indisponível para download.");
            return;
          }
          setConfirmOpen(true);
        }}
        aria-label={`Baixar ${name}`}
      >
        <FileText className="h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          {sizeLabel ? <p className="text-xs text-muted-foreground">{sizeLabel}</p> : null}
        </div>
      </button>
      <DownloadFileConfirmDialog
        open={confirmOpen}
        name={name}
        sizeLabel={sizeLabel}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={download}
      />
    </>
  );
}
