import { ChatAvatar } from "@/components/support-chat/ChatAvatar";
import { formatChatListTime } from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import type { SupportChat } from "@/types/supportChat";

export function ConversationAccess({
  chat,
  active,
  agentContactId,
  onSelect,
}: {
  chat: SupportChat;
  active: boolean;
  agentContactId?: string | null;
  onSelect: (id: string) => void;
}) {
  const preview = chat.lastMessage || "Iniciar conversa";
  const fromSelf = Boolean(
    agentContactId && chat.lastMessageSenderId && chat.lastMessageSenderId === agentContactId
  );
  const lastMessagePreview = fromSelf ? `Você: ${preview}` : preview;
  return (
    <button
      type="button"
      onClick={() => onSelect(chat.id)}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors",
        active ? "bg-primary/15" : "hover:bg-secondary/70"
      )}
    >
      <ChatAvatar name={chat.name} imageUrl={chat.iconUrl} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-bold">{chat.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatChatListTime(chat.lastAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-muted-foreground">
            {lastMessagePreview}
          </span>
          {chat.unread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-black text-primary-foreground">
              {chat.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
