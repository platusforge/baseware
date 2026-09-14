const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Single-flight refresh: concurrent 401s share one /auth/refresh call.
let refreshPromise: Promise<void> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("refresh failed");
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  try {
    await refreshPromise;
    return true;
  } catch {
    return false;
  }
}

function unauthorized(): never {
  window.dispatchEvent(new Event("unauthorized"));
  throw new Error("Session expired");
}

async function request<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && !retried && !endpoint.startsWith("/auth/")) {
    // Access token may have expired while the 7-day refresh is still valid.
    if (await tryRefresh()) return request<T>(endpoint, options, true);
    unauthorized();
  }

  if (!response.ok) {
    if (response.status === 401) unauthorized();
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || `Error ${response.status}`);
  }
  return response.json();
}

function orgHeaders(orgId?: string): RequestInit {
  return orgId ? { headers: { "x-org-id": orgId } } : {};
}

export const api = {
  get: <T>(endpoint: string, orgId?: string) => request<T>(endpoint, { method: "GET", ...orgHeaders(orgId) }),
  post: <T>(endpoint: string, body?: unknown, orgId?: string) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...orgHeaders(orgId) }),
  put: <T>(endpoint: string, body?: unknown, orgId?: string) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body), ...orgHeaders(orgId) }),
  del: <T>(endpoint: string, body?: unknown, orgId?: string) =>
    request<T>(endpoint, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
      ...orgHeaders(orgId),
    }),
};
