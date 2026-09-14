import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { env } from "@/env";

/**
 * Blocks paid/abuse-sensitive actions for unverified e-mails.
 * Login itself stays allowed (so users can reach /settings to resend),
 * but checkout, invites, api-keys and uploads require verification.
 * Disable globally with REQUIRE_VERIFIED_EMAIL=false (not recommended).
 */
export function requireVerifiedEmail() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!env.REQUIRE_VERIFIED_EMAIL) return next();
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
      if (!user?.emailVerifiedAt) {
        return res.status(403).json({ message: "Verify your email to continue. Check your inbox or resend from Settings." });
      }
      return next();
    } catch {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
}
