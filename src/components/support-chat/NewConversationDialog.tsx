import { ChatAvatar } from "@/components/support-chat/ChatAvatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { createChat } from "@/lib/api/chats";
import { createContact, searchContacts } from "@/lib/api/contacts";
import { cn } from "@/lib/utils";
import type { IChat } from "@/types/chat";
import type { CreateContactPayload, IContact } from "@/types/contact";
import { ChevronLeft, Loader2, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type View = "list" | "create";

function contactIdOf(contact: IContact): string {
  const raw = contact._id ?? (contact as IContact & { id?: string }).id;
  if (!raw) return "";
  return typeof raw === "string" ? raw : String(raw);
}

export function NewConversationDialog({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (chat: IChat, contact: IContact) => void;
}) {
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setView("list");
    setQuery("");
    setContacts([]);
    setStartingId(null);
    setName("");
    setIdentifier("");
    setFormError("");
    setSaving(false);
  };

  useEffect(() => {
    if (!open || view !== "list") return;
    let cancelled = false;
    const handle = window.setTimeout(
      async () => {
        setLoading(true);
        try {
          const result = await searchContacts({
            page: 1,
            limit: 50,
            searchText: query.trim() || undefined,
          });
          if (!cancelled) setContacts(result.items ?? []);
        } catch (e) {
          if (!cancelled) {
            toast.error(e instanceof Error ? e.message : "Erro ao buscar contatos.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      query.trim() ? 300 : 0
    );
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, view]);

  const startConversation = async (contact: IContact): Promise<boolean> => {
    const contactId = contactIdOf(contact);
    if (!contactId) {
      toast.error("Contato sem identificador interno.");
      return false;
    }
    setStartingId(contactId);
    try {
      const chat = await createChat({ contacts: [contactId], name: contact.name });
      onStarted(chat, contact);
      reset();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar conversa.");
      return false;
    } finally {
      setStartingId(null);
    }
  };

  const submitNewContact = async () => {
    const payload: CreateContactPayload = {
      name: name.trim(),
      identifier: identifier.trim(),
    };
    if (!payload.name || !payload.identifier) {
      setFormError("Informe nome e identificador (WhatsApp).");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const contact = await createContact(payload);
      toast.success("Contato criado.");
      const started = await startConversation(contact);
      if (!started) setView("list");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar contato.");
    } finally {
      setSaving(false);
    }
  };

  const busy = Boolean(startingId) || saving;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-hidden sm:max-w-lg">
        {view === "list" ? (
          <>
            <DialogHeader>
              <DialogTitle>Iniciar conversa</DialogTitle>
              <DialogDescription>
                Selecione um contato. Se ainda não houver chat, ele será criado. Você também pode cadastrar um
                novo contato e iniciar a conversa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full"
                disabled={busy}
                onClick={() => setView("create")}
              >
                <UserPlus className="h-5 w-5" />
                Novo contato
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="h-11 pl-10"
                  disabled={busy}
                />
              </div>
              <div className="max-h-[min(50dvh,22rem)] overflow-y-auto rounded-xl border border-border">
                {loading ? (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : contacts.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum contato encontrado.
                  </p>
                ) : (
                  <ul>
                    {contacts.map((contact) => {
                      const id = contactIdOf(contact);
                      const starting = startingId === id;
                      return (
                        <li key={id || contact.identifier}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startConversation(contact)}
                            className={cn(
                              "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-secondary/70",
                              starting && "bg-primary/10"
                            )}
                          >
                            <ChatAvatar name={contact.name} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-bold">{contact.name}</span>
                              <span className="block truncate text-sm text-muted-foreground">
                                {contact.identifier}
                              </span>
                            </span>
                            {starting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo contato</DialogTitle>
              <DialogDescription>
                Cadastro de contato de cliente (WhatsApp). Em seguida a conversa é iniciada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-conversation-contact-name">Nome *</Label>
                <Input
                  id="new-conversation-contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do contato"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-conversation-contact-identifier">Identificador (WhatsApp) *</Label>
                <Input
                  id="new-conversation-contact-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="5511990000000"
                  disabled={busy}
                />
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                className="h-12"
                disabled={busy}
                onClick={() => {
                  setFormError("");
                  setView("list");
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="button" variant="accent" className="h-12" onClick={submitNewContact} disabled={busy}>
                {busy ? "Iniciando..." : "Criar e iniciar conversa"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
