import type { MessageKey, TFunction } from "@/i18n";

/**
 * The API stays locale-agnostic (English messages + HTTP codes). Known
 * user-facing messages are mapped to catalog keys here; unknown ones pass
 * through so nothing is hidden during development.
 */
const KNOWN_MESSAGES: Record<string, MessageKey> = {
  "Invalid credentials.": "loginFailed",
  "Too many requests": "tooManyRequests",
  "Invalid or expired token.": "resetInvalid",
  "Invalid or expired invitation.": "inviteInvalid",
  "Forbidden": "forbidden",
  "Missing credentials.": "sessionExpired",
  "Invalid refresh token.": "sessionExpired",
  "MFA_REQUIRED": "mfaRequired",
  "Invalid code.": "invalidCode",
  "MFA already enabled.": "mfaAlreadyEnabled",
  "MFA not initialized. Start setup first.": "mfaNotInitialized",
  "MFA not enabled.": "mfaNotEnabled",
  "Password confirmation required.": "passwordConfirmationRequired",
  "Password must be at least 12 characters.": "passwordTooShort",
  "Organization not found.": "organizationNotFound",
  "Invitation not found.": "invitationNotFound",
  "Seat limit reached for this plan. Upgrade to invite more members.": "seatLimit",
  "This invitation was sent to a different email address.": "invitationWrongEmail",
  "Plan does not include API keys. Upgrade to continue.": "planBlocked",
  "An account with this email already exists. Log in to link.": "oauthAccountExists",
  "Billing not configured.": "billingNotConfigured",
  "No billing customer yet.": "noBillingCustomer",
};

/** Localizes a known API error message; falls back to `fallback` for empty input. */
export function translateApiError(raw: string, t: TFunction, fallback: MessageKey = "genericError"): string {
  if (!raw) return t(fallback);
  const key = KNOWN_MESSAGES[raw];
  return key ? t(key) : raw;
}
