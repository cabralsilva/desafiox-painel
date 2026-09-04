import { apiRequest } from "@/lib/api";
import { setAuthSession } from "@/lib/session";
import { getAccountIdFromToken } from "@/lib/jwtPayload";

export interface AdminAccount {
  id: string;
  name: string;
  emailAccess: string;
}

export async function adminSignIn(email: string, password: string): Promise<string> {
  const basic = btoa(`${email.trim()}:${password}`);
  const response = await apiRequest("/admin/signin", {
    method: "POST",
    auth: false,
    invalidateOnAuthError: false,
    headers: { Authorization: `Basic ${basic}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Falha no login administrativo.");
  }

  const token = data?.access_token as string | undefined;
  if (!token) throw new Error("Token de acesso não retornado.");
  setAuthSession(token);
  return token;
}

export async function fetchLoggedAdmin(): Promise<AdminAccount | null> {
  const id = getAccountIdFromToken();
  if (!id) return null;
  const response = await apiRequest(
    `/admin/account/${encodeURIComponent(id)}?select=name,emailAccess,image`,
    { invalidateOnAuthError: false }
  );
  if (!response.ok) return null;
  const body = await response.json();
  return {
    id: body.id ?? body._id?.toString?.() ?? id,
    name: body.name ?? "Administrador",
    emailAccess: body.emailAccess ?? "",
  };
}
