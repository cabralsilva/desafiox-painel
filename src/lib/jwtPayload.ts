import { getAuthToken } from "@/lib/session";

/** Decodifica o payload do JWT (sem validar assinatura — só leitura no cliente). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** ID da conta no token emitido pelo sign-in (`account` / `sub`). */
export function getAccountIdFromToken(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const id = payload?.account ?? payload?.sub;
  return typeof id === "string" && id.length > 0 ? id : null;
}
