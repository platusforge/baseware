/**
 * Maps generic API messages to friendly, localized auth errors.
 * Server messages are English-only; known ones are translated client-side.
 */
export function friendlyAuthError(raw: string, t: (key: string) => string): string {
  if (!raw || raw === "Invalid credentials.") return t("loginFailed");
  if (raw === "Too many requests") return t("tooManyRequests");
  return raw;
}
