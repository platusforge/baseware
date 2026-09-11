const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("unauthorized"));
      throw new Error("Session expired");
    }
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
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
