const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * A 401 from these endpoints is a normal answer (wrong password, dead token,
 * failed OAuth) — it must surface the server message, never trigger a
 * "session expired" redirect or a refresh retry.
 */
const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/reset/request",
  "/auth/reset/confirm",
  "/auth/verify/confirm",
  "/auth/oauth/",
];

/** Session probe: a 401 just means "not logged in" (public pages stay public). */
const SESSION_PROBE_ENDPOINT = "/auth/me";

/**
 * Local hint that this browser had a session. Anonymous visitors must never
 * spend rate-limit budget on futile /auth/refresh calls from the probe.
 */
const SESSION_HINT_KEY = "sb-has-session";

export function setSessionHint(active: boolean): void {
  try {
    if (active) localStorage.setItem(SESSION_HINT_KEY, "1");
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // ignore (storage blocked)
  }
}

function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function isPublicAuthEndpoint(endpoint: string): boolean {
  return PUBLIC_AUTH_ENDPOINTS.some((prefix) => endpoint === prefix || endpoint.startsWith(prefix));
}

// Single-flight refresh: concurrent 401s share one /auth/refresh call.
let refreshPromise: Promise<void> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("refresh failed");
        setSessionHint(true);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  try {
    await refreshPromise;
    return true;
  } catch {
    setSessionHint(false);
    return false;
  }
}

function unauthorized(): never {
  setSessionHint(false);
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

  const publicAuth = isPublicAuthEndpoint(endpoint);

  if (response.status === 401 && !retried && !publicAuth) {
    // Public visitors have no session: skip the futile refresh round-trip.
    if (endpoint === SESSION_PROBE_ENDPOINT && !hasSessionHint()) {
      throw new Error("Unauthorized");
    }
    // Access token may have expired while the 7-day refresh is still valid.
    if (await tryRefresh()) return request<T>(endpoint, options, true);
    // The session probe must not force a redirect: on public pages a 401
    // simply means "anonymous". PrivateRoute handles the protected case.
    if (endpoint === SESSION_PROBE_ENDPOINT) throw new Error("Unauthorized");
    unauthorized();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error as { message?: string }).message || `Error ${response.status}`;
    if (response.status === 401 && !publicAuth && endpoint !== SESSION_PROBE_ENDPOINT) unauthorized();
    throw new Error(message);
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
