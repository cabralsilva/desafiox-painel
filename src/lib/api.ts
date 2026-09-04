import { getAuthToken, invalidateSessionAndRedirectToLogin } from "@/lib/session";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

if (!apiBaseUrl) {
  console.warn("VITE_API_URL não configurada.");
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  invalidateOnAuthError?: boolean;
};

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_URL não configurada.");
  }

  const {
    auth = true,
    invalidateOnAuthError = true,
    headers,
    ...rest
  } = options;

  const mergedHeaders = new Headers(headers || {});
  if (auth) {
    const token = getAuthToken();
    if (token) mergedHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (!mergedHeaders.has("Accept")) {
    mergedHeaders.set("Accept", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });

  if ((response.status === 401 || response.status === 403) && invalidateOnAuthError) {
    invalidateSessionAndRedirectToLogin();
  }

  return response;
}

export async function apiJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await apiRequest(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Erro ${response.status}`);
  }
  return data as T;
}
