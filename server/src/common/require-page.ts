import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";

function toSet(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

/** RBAC: Role > direct UserPermission > configured:false blocks. */
export function requirePage(...keys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { type: true } });
      if (user?.type === "admin") return next();
      const perm = await prisma.userPermission.findUnique({ where: { userId } });
      if (!perm || perm.configured === false) return res.status(403).json({ message: "Forbidden" });
      const allowed = toSet(perm.allowedPages);
      if (allowed.length === 0) return next();
      const ok = keys.some((k) => allowed.includes(k));
      if (!ok) return res.status(403).json({ message: "Forbidden" });
      return next();
    } catch {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  prisma.user
    .findUnique({ where: { id: req.user?.userId ?? "" }, select: { type: true } })
    .then((u) => (u?.type === "admin" ? next() : res.status(403).json({ message: "Forbidden" })))
    .catch(() => res.status(403).json({ message: "Forbidden" }));
}
