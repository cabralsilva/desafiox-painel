const AUTH_FLAG_KEY = "desafiox_painel_auth";
const TOKEN_KEY = "desafiox_painel_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string) {
  localStorage.setItem(AUTH_FLAG_KEY, "true");
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_FLAG_KEY);
  localStorage.removeItem(TOKEN_KEY);
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
