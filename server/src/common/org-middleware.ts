import { Request, Response, NextFunction } from "express";
import { sha256 } from "@/lib/crypto";
import { apiKeyRepository, userRepository, organizationRepository, membershipRepository } from "@/repositories";

declare global {
  namespace Express {
    interface Request {
      apiScopes?: string[];
    }
  }
}

/** Organization membership guard. Expects :orgId param or x-org-id header. */
export function requireOrgRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const organizationId = (req.params.orgId as string) ?? (req.headers["x-org-id"] as string);
      if (!userId || !organizationId) return res.status(403).json({ message: "Forbidden" });
      const org = await organizationRepository.findById(organizationId);
      if (!org || (org as { active?: boolean }).active === false) return res.status(403).json({ message: "Forbidden" });
      const membership = await membershipRepository.findRole(userId, organizationId);
      if (!membership) return res.status(403).json({ message: "Forbidden" });
      if (roles.length > 0 && !roles.includes(membership)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.organizationId = organizationId;
      return next();
    } catch {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
}

/** API-key auth for machine-to-machine calls. Header: x-api-key: <prefix>.<secret> */
export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.headers["x-api-key"] as string | undefined;
    if (!raw) return res.status(401).json({ message: "Unauthorized" });
    const keyHash = sha256(raw);
    const key = await apiKeyRepository.findByHash(keyHash);
    if (!key || key.revokedAt) return res.status(401).json({ message: "Unauthorized" });
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return res.status(401).json({ message: "Unauthorized" });
    const sessionUser = await userRepository.findSessionUser(key.userId);
    if (!sessionUser || sessionUser.active === false) return res.status(401).json({ message: "Unauthorized" });
    if (key.organizationId) {
      const org = await organizationRepository.findById(key.organizationId);
      if (!org || (org as { active?: boolean }).active === false) return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = { userId: key.userId, jti: `apikey:${key.id}` };
    req.apiScopes = key.scopes ?? [];
    if (key.organizationId) req.organizationId = key.organizationId;
    await apiKeyRepository.touch(key.id);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/** Require API-key scopes on routes mounted behind apiKeyMiddleware. */
export function requireApiScopes(...scopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const granted = req.apiScopes ?? [];
    const ok = scopes.every((s) => granted.includes(s));
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}
