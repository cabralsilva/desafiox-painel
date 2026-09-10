import type { IContact } from "@/types/contact";

const AUTH_FLAG_KEY = "desafiox_painel_auth";
const TOKEN_KEY = "desafiox_painel_token";
const CONTACT_KEY = "desafiox_painel_contact";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionContact(): IContact | null {
  const raw = localStorage.getItem(CONTACT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IContact;
  } catch {
    return null;
  }
}

export function getSessionContactId(): string | null {
  const contact = getSessionContact();
  const id = contact?._id?.toString?.() ?? contact?._id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export function setSessionContact(contact: IContact | null) {
  if (!contact) {
    localStorage.removeItem(CONTACT_KEY);
    return;
  }
  localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
}

export function setAuthSession(token: string) {
  localStorage.setItem(AUTH_FLAG_KEY, "true");
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CONTACT_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

export function invalidateSessionAndRedirectToLogin() {
  clearAuthSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}
