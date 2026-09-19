import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendFilesConfirmDialog, type AttachKind } from "@/components/support-chat/SendFilesConfirmDialog";
import { fetchWhatsAppTemplates, type WhatsAppApprovedTemplate } from "@/lib/api/chatRealtime";
import { CHAT_EMOJIS } from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon, Paperclip, Send, Video } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function ChatComposer({
  onSendText,
  onSendTemplate,
  onSendFiles,
  focusKey,
  canSend,
  sessionWindowOpen,
}: {
  onSendText: (text: string) => void | Promise<void>;
  onSendTemplate: (templateName: string, templateLanguage: string) => void | Promise<void>;
  onSendFiles: (files: File[], kind: AttachKind) => void | Promise<void>;
  focusKey?: string | number;
  canSend: boolean;
  sessionWindowOpen: boolean | null;
}) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<{ files: File[]; kind: AttachKind } | null>(null);
  const [templates, setTemplates] = useState<WhatsAppApprovedTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("pt_BR");
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const templateOnly = canSend && sessionWindowOpen === false;

  useEffect(() => {
    if (focusKey === undefined || !canSend || templateOnly) return;
    const frame = window.requestAnimationFrame(() => {
      messageRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusKey, canSend, templateOnly]);

  useEffect(() => {
    if (!templateOnly) return;
    let cancelled = false;
    void fetchWhatsAppTemplates()
      .then((items) => {
        if (!cancelled) setTemplates(items);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [templateOnly]);

  const send = async () => {
    const next = text.trim();
    if (!next || !canSend || sending || templateOnly) return;
    setSending(true);
    try {
      await onSendText(next);
      setText("");
      setEmojiOpen(false);
    } catch {
      // o rascunho permanece se a API falhar
    } finally {
      setSending(false);
    }
  };

  const sendTemplate = async () => {
    const name = templateName.trim();
    if (!name || !canSend || sending) return;
    setSending(true);
    try {
      await onSendTemplate(name, templateLanguage.trim() || "pt_BR");
    } catch {
      // o nome permanece se a API falhar
    } finally {
      setSending(false);
    }
  };

  const queueFiles = (list: FileList | null, kind: AttachKind) => {
    const selected = list ? Array.from(list) : [];
    const files = kind === "file" ? selected.slice(0, 1) : selected;
    if (!files.length || !canSend || sending || templateOnly) return;
    setAttachOpen(false);
    setEmojiOpen(false);
    setPending({ files, kind });
  };

  const confirmFiles = async () => {
    if (!pending || sending) return;
    setSending(true);
    try {
      await onSendFiles(pending.files, pending.kind);
      setPending(null);
    } catch {
      // o diálogo permanece aberto se a API falhar
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const disabled = !canSend || sending;
  const uniqueTemplateNames = Array.from(new Set(templates.map((item) => item.name)));

  return (
    <div className="relative shrink-0 border-t border-border bg-card p-2 sm:p-3">
      {pending ? (
        <SendFilesConfirmDialog
          files={pending.files}
          kind={pending.kind}
          sending={sending}
          onCancel={() => {
            if (!sending) setPending(null);
          }}
          onConfirm={() => void confirmFiles()}
        />
      ) : null}

      {emojiOpen ? (
        <div className="absolute bottom-[calc(100%-0.25rem)] left-2 z-20 grid w-[min(100%-1rem,20rem)] grid-cols-8 gap-1 rounded-2xl border border-border bg-popover p-2 shadow-soft">
          {CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-10 items-center justify-center rounded-lg text-xl hover:bg-secondary"
              onClick={() => setText((prev) => prev + emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {attachOpen ? (
        <div className="absolute bottom-[calc(100%-0.25rem)] left-14 z-20 w-52 overflow-hidden rounded-2xl border border-border bg-popover py-1 shadow-soft">
          <AttachItem
            icon={ImageIcon}
            label="Foto"
            onClick={() => {
              setAttachOpen(false);
              imageRef.current?.click();
            }}
          />
          <AttachItem
            icon={Video}
            label="Vídeo"
            onClick={() => {
              setAttachOpen(false);
              videoRef.current?.click();
            }}
          />
          <AttachItem
            icon={FileText}
            label="Arquivo"
            onClick={() => {
              setAttachOpen(false);
              fileRef.current?.click();
            }}
          />
        </div>
      ) : null}

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          queueFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          queueFiles(e.target.files, "video");
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          queueFiles(e.target.files, "file");
          e.target.value = "";
        }}
      />

      {sessionWindowOpen == null && canSend ? (
        <p className="mb-2 px-1 text-xs text-muted-foreground">Verificando janela de 24h do WhatsApp…</p>
      ) : null}

      {!canSend ? (
        <p className="mb-2 px-1 text-xs text-muted-foreground">
          Não há contato vinculado ao usuário logado. O envio de mensagens fica desabilitado.
        </p>
      ) : null}

      {templateOnly ? (
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold text-muted-foreground">
            Janela de 24h fechada. Só é possível enviar um template aprovado do WhatsApp.
          </p>
          {uniqueTemplateNames.length ? (
            <select
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={uniqueTemplateNames.includes(templateName) ? templateName : ""}
              onChange={(e) => {
                const name = e.target.value;
                setTemplateName(name);
                const match = templates.find((item) => item.name === name);
                if (match?.language) setTemplateLanguage(match.language);
              }}
              disabled={disabled}
            >
              <option value="">Selecionar template</option>
              {uniqueTemplateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="flex items-end gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template (ex.: hello_world)"
              disabled={disabled}
              className="h-12 rounded-xl"
            />
            <Input
              value={templateLanguage}
              onChange={(e) => setTemplateLanguage(e.target.value)}
              placeholder="pt_BR"
              disabled={disabled}
              className="h-12 w-24 shrink-0 rounded-xl"
            />
            <Button
              type="button"
              variant="accent"
              className="h-12 shrink-0 px-4"
              onClick={() => void sendTemplate()}
              disabled={disabled || !templateName.trim()}
            >
              Enviar template
            </Button>
          </div>
        </div>
      ) : sessionWindowOpen === true || !canSend ? (
        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary",
              attachOpen && "ring-1 ring-accent",
              disabled && "opacity-50"
            )}
            aria-label="Anexar"
            onClick={() => {
              if (disabled) return;
              setEmojiOpen(false);
              setAttachOpen((v) => !v);
            }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={messageRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={disabled}
            placeholder={canSend ? "Mensagem" : "Envio indisponível"}
            className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button
            type="button"
            variant="accent"
            className="h-12 w-12 shrink-0 p-0"
            onClick={() => void send()}
            disabled={disabled || !text.trim()}
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AttachItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ImageIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-semibold hover:bg-secondary"
    >
      <Icon className="h-4 w-4 text-accent" />
      {label}
    </button>
  );
}
