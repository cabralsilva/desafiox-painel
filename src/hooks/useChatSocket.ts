import { useEffect, useRef } from "react";
import type { ChatRealtimeEvent } from "@/lib/api/chatRealtime";
import { getDeviceId } from "@/lib/deviceId";
import { getAuthToken } from "@/lib/session";

function realtimeWsUrl(token: string, deviceId: string): string {
  const http = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const ws = http.replace(/^http/i, "ws");
  const params = new URLSearchParams({ token, deviceId });
  return `${ws}/admin/chat/realtime/ws?${params.toString()}`;
}

export function useChatSocket(
  enabled: boolean,
  onEvent: (event: ChatRealtimeEvent) => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const token = getAuthToken();
    if (!token) return;

    let closed = false;
    let socket: WebSocket | null = null;
    let retries = 0;
    let timer: number | undefined;

    const connect = () => {
      if (closed) return;
      const deviceId = getDeviceId();
      socket = new WebSocket(realtimeWsUrl(token, deviceId));
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as ChatRealtimeEvent;
          if (payload?.type && payload.message) onEventRef.current(payload);
        } catch {
          /* ignore */
        }
      };
      socket.onopen = () => {
        retries = 0;
      };
      socket.onclose = () => {
        if (closed) return;
        const wait = Math.min(15_000, 800 * 2 ** retries);
        retries += 1;
        timer = window.setTimeout(connect, wait);
      };
      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();
    return () => {
      closed = true;
      if (timer) window.clearTimeout(timer);
      socket?.close();
    };
  }, [enabled]);
}
