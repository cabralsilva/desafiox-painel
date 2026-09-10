import { ChatAvatar } from "@/components/support-chat/ChatAvatar";
import { Button } from "@/components/ui/button";
import { formatChatClock, formatChatDayLabel } from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import {
  SUPPORT_TICKET_STATUS_LABEL,
  type SupportTicket,
  type SupportTicketStatus,
  type SupportChat,
} from "@/types/supportChat";
import { FileText, ImageIcon, Plus, Video, X } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_CLASS: Record<SupportTicketStatus, string> = {
  OPEN: "bg-accent/20 text-accent",
  IN_REVIEW: "bg-highlight/20 text-highlight",
  WAITING_CLIENT: "bg-secondary text-muted-foreground",
  RESOLVED: "bg-success/20 text-success",
};

export function ChatDetailsPanel({
  chat,
  onClose,
  onNewTicket,
}: {
  chat: SupportChat;
  onClose: () => void;
  onNewTicket: () => void;
}) {
  const [openTicketId, setOpenTicketId] = useState<string | null>(chat.tickets[0]?.id ?? null);

  useEffect(() => {
    setOpenTicketId(chat.tickets[0]?.id ?? null);
  }, [chat.id]);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border bg-card">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-3">
        <h2 className="text-base font-black tracking-tight">Detalhes</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"
          aria-label="Recolher detalhes"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-border px-4 py-5 text-center">
          <ChatAvatar name={chat.name} size="lg" />
          <h3 className="mt-3 text-lg font-black tracking-tight">{chat.name}</h3>
          <p className="text-sm text-muted-foreground">{chat.contact.phone}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {chat.contact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-b border-border px-4 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contato</h3>
          <DetailRow label="E-mail" value={chat.contact.email} />
          <DetailRow label="Cidade" value={chat.contact.city} />
          <DetailRow label="Conta" value={chat.contact.accountLabel} />
          <p className="text-xs text-muted-foreground">
            Dados mockados. A ficha real entra quando a API do WhatsApp estiver ligada.
          </p>
        </section>

        <section className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tickets de suporte
            </h3>
            <Button type="button" variant="secondary" className="h-10 px-3" onClick={onNewTicket}>
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Solicitações com análise e artefatos. Não são os tickets de palpite do desafio.
          </p>
          {chat.tickets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum ticket de suporte neste contato.
            </p>
          ) : (
            <ul className="space-y-2">
              {chat.tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  open={openTicketId === ticket.id}
                  onToggle={() => setOpenTicketId((id) => (id === ticket.id ? null : ticket.id))}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function TicketCard({
  ticket,
  open,
  onToggle,
}: {
  ticket: SupportTicket;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-background">
      <button type="button" onClick={onToggle} className="flex w-full flex-col gap-1 px-3 py-3 text-left">
        <span className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{ticket.protocol}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              STATUS_CLASS[ticket.status]
            )}
          >
            {SUPPORT_TICKET_STATUS_LABEL[ticket.status]}
          </span>
        </span>
        <span className="font-bold">{ticket.subject}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {ticket.artifacts.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Artefatos
              </p>
              <ul className="space-y-1.5">
                {ticket.artifacts.map((artifact) => {
                  const Icon = artifact.kind === "image" ? ImageIcon : artifact.kind === "video" ? Video : FileText;
                  return (
                    <li key={artifact.id} className="flex items-center gap-2 rounded-xl bg-secondary px-2 py-2 text-xs">
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{artifact.name}</span>
                      <span className="text-muted-foreground">{artifact.sizeLabel}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Histórico
            </p>
            <ol className="space-y-2">
              {ticket.history.map((event) => (
                <li key={event.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-xs font-semibold">{event.text}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {event.author === "system" ? "Sistema" : event.author === "agent" ? "Atendente" : "Cliente"}
                    {" · "}
                    {formatChatDayLabel(event.at)} {formatChatClock(event.at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </li>
  );
}
