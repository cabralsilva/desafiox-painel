import { Button } from "@/components/ui/button";
import { SendFilesConfirmDialog, type AttachKind } from "@/components/support-chat/SendFilesConfirmDialog";
import { CHAT_EMOJIS } from "@/lib/supportChat";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon, Paperclip, Send, Smile, Video } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function ChatComposer({
  onSendText,
  onSendFiles,
  focusKey,
  canSend,
}: {
  onSendText: (text: string) => void | Promise<void>;
  onSendFiles: (files: File[], kind: AttachKind) => void | Promise<void>;
  focusKey?: string | number;
  canSend: boolean;
}) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<{ files: File[]; kind: AttachKind } | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusKey === undefined || !canSend) return;
    const frame = window.requestAnimationFrame(() => {
      messageRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusKey, canSend]);

  const send = async () => {
    const next = text.trim();
    if (!next || !canSend || sending) return;
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

  const queueFiles = (list: FileList | null, kind: AttachKind) => {
    const selected = list ? Array.from(list) : [];
    const files = kind === "file" ? selected.slice(0, 1) : selected;
    if (!files.length || !canSend || sending) return;
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

      {!canSend ? (
        <p className="mb-2 px-1 text-xs text-muted-foreground">
          Não há contato vinculado ao usuário logado. O envio de mensagens fica desabilitado.
        </p>
      ) : null}

      <div className="flex items-end gap-2">
        {/* <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary",
            emojiOpen && "ring-1 ring-accent",
            disabled && "opacity-50"
          )}
          aria-label="Emojis"
          onClick={() => {
            if (disabled) return;
            setAttachOpen(false);
            setEmojiOpen((v) => !v);
          }}
        >
          <Smile className="h-5 w-5" />
        </button> */}
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
