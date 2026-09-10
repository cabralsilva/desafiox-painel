import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type MediaLightboxItem = {
  kind: "image" | "video";
  url: string;
  name?: string;
};

const SWIPE_THRESHOLD = 64;
const AXIS_LOCK = 12;

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: MediaLightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const current = items[index];
  const canSwipe = items.length > 1;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const skipTransitionRef = useRef(false);
  const didSwipeRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    dx: number;
    locked: boolean;
    ignore: boolean;
  } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [hasNext, hasPrev, index, onClose, onIndexChange]);

  useEffect(() => {
    skipTransitionRef.current = false;
    setOffsetX(0);
    setDragging(false);
    dragRef.current = null;
  }, [index]);

  const finishDrag = (clientX: number) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.ignore || !drag.locked) {
      setOffsetX(0);
      setDragging(false);
      return;
    }
    const dx = clientX - drag.startX;
    const dt = Math.max(Date.now() - drag.startTime, 1);
    const velocity = Math.abs(dx) / dt;
    const goPrev = dx > 0 && (dx > SWIPE_THRESHOLD || (dx > 28 && velocity > 0.35));
    const goNext = dx < 0 && (-dx > SWIPE_THRESHOLD || (-dx > 28 && velocity > 0.35));
    didSwipeRef.current = true;
    setDragging(false);
    if (goPrev && hasPrev) {
      skipTransitionRef.current = true;
      setOffsetX(0);
      onIndexChange(index - 1);
      return;
    }
    if (goNext && hasNext) {
      skipTransitionRef.current = true;
      setOffsetX(0);
      onIndexChange(index + 1);
      return;
    }
    setOffsetX(0);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-lightbox-ui]")) return;
    if (isVideoControlsTarget(e)) {
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTime: Date.now(),
        dx: 0,
        locked: false,
        ignore: true,
      };
      return;
    }
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      dx: 0,
      locked: false,
      ignore: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || drag.ignore) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.locked) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.ignore = true;
        return;
      }
      drag.locked = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    let next = dx;
    if ((dx > 0 && !hasPrev) || (dx < 0 && !hasNext)) next = dx * 0.28;
    drag.dx = next;
    setOffsetX(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finishDrag(e.clientX);
  };

  if (!current) return null;

  const slideStyle = {
    transform: `translate3d(calc(${-index * 100}% + ${offsetX}px), 0, 0)`,
    transition: dragging || skipTransitionRef.current ? "none" : "transform 220ms ease-out",
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex select-none items-center justify-center overflow-hidden bg-black"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if (didSwipeRef.current) {
          didSwipeRef.current = false;
          e.preventDefault();
          return;
        }
        if ((e.target as HTMLElement).closest("[data-lightbox-ui],[data-lightbox-media]")) return;
        onClose();
      }}
    >
      <button
        type="button"
        data-lightbox-ui
        className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
        aria-label="Fechar"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>
      {hasPrev ? (
        <button
          type="button"
          data-lightbox-ui
          className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          aria-label="Anterior"
          onClick={() => onIndexChange(index - 1)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}
      {hasNext ? (
        <button
          type="button"
          data-lightbox-ui
          className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          aria-label="Próximo"
          onClick={() => onIndexChange(index + 1)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}
      <div className="relative z-[1] h-full w-full overflow-hidden">
        <div className="flex h-full w-full" style={slideStyle}>
          {items.map((item, itemIndex) => (
            <div
              key={`${item.url}-${itemIndex}`}
              className="flex h-full w-full shrink-0 grow-0 basis-full items-center justify-center"
            >
              {item.kind === "image" ? (
                <img
                  data-lightbox-media
                  src={item.url}
                  alt={item.name || ""}
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain"
                />
              ) : (
                <video
                  data-lightbox-media
                  key={item.url}
                  src={item.url}
                  className="max-h-full max-w-full"
                  controls={itemIndex === index}
                  autoPlay={itemIndex === index}
                  muted={itemIndex !== index}
                  playsInline
                  preload={itemIndex === index ? "auto" : "metadata"}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function isVideoControlsTarget(e: React.PointerEvent): boolean {
  const video = (e.target as HTMLElement | null)?.closest?.("video");
  if (!video) return false;
  const rect = video.getBoundingClientRect();
  return e.clientY > rect.bottom - 56;
}
