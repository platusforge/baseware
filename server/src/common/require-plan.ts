import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import { planAllows, normalizePlan } from "@/lib/plans";

/**
 * Plan gate. Must run AFTER authMiddleware + requireOrgRole (uses req.organizationId).
 * Responds 402 when the org plan is below the feature minimum — frontend
 * redirects to /dashboard/billing on 402.
 */
export function requirePlan(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.organizationId ?? (req.params.orgId as string) ?? (req.headers["x-org-id"] as string);
      if (!organizationId) return res.status(400).json({ message: "Missing organization." });
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { plan: true } });
      const plan = normalizePlan(org?.plan);
      if (!planAllows(plan, feature)) {
        return res.status(402).json({ message: `Plan ${plan} does not include ${feature}. Upgrade to continue.`, plan, feature });
      }
      return next();
    } catch {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
}
