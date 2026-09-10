import { ConversationAccess } from "@/components/support-chat/ConversationAccess";
import type { SupportChat } from "@/types/supportChat";

export function ConversationList({
  chats,
  selectedId,
  agentContactId,
  onSelect,
}: {
  chats: SupportChat[];
  selectedId: string | null;
  agentContactId?: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat.id}>
          <ConversationAccess
            chat={chat}
            active={chat.id === selectedId}
            agentContactId={agentContactId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
