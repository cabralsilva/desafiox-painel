import { ConversationList } from "@/components/support-chat/ConversationList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportChat } from "@/types/supportChat";
import { MessageCirclePlusIcon, Search } from "lucide-react";

export function ChatContactColumn({
  chats,
  selectedId,
  search,
  loading,
  onSearch,
  onSelect,
  onNewConversation,
  agentContactId,
}: {
  chats: SupportChat[];
  selectedId: string | null;
  search: string;
  loading?: boolean;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  agentContactId?: string | null;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-card">
      <div className="shrink-0 space-y-3 border-b border-border p-3">
        <h1 className="text-lg font-black tracking-tight">Chat/Suporte</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="h-11 pl-10"
          />
        </div>
        <Button
          type="button"
          variant="accent"
          className="h-11 w-full shrink-0 px-3"
          onClick={onNewConversation}
        >
          <MessageCirclePlusIcon className="h-5 w-5" />
          Nova conversa
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : chats.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
        ) : (
          <ConversationList
            chats={chats}
            selectedId={selectedId}
            agentContactId={agentContactId}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
