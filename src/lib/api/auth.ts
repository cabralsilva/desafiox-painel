import { apiRequest } from "@/lib/api";
import { getAccountIdFromToken } from "@/lib/jwtPayload";
import { fetchContactByAdminAccount } from "@/lib/api/contacts";
import { setAuthSession, setSessionContact } from "@/lib/session";
import type { IContact } from "@/types/contact";

export interface AdminAccount {
  id: string;
  name: string;
  emailAccess: string;
}

export async function loadSessionContact(): Promise<IContact | null> {
  const adminAccountId = getAccountIdFromToken();
  if (!adminAccountId) {
    setSessionContact(null);
    return null;
  }
  try {
    const contact = await fetchContactByAdminAccount(adminAccountId);
    setSessionContact(contact);
    return contact;
  } catch {
    setSessionContact(null);
    return null;
  }
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
  await loadSessionContact();
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
