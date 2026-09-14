import { Request, Response, NextFunction } from "express";
import { userRepository, permissionRepository } from "@/repositories";

/** RBAC: admin type bypass > UserPermission allowlist > configured:false blocks.
 * Missing permission row = legacy open mode (allow). Empty allowedPages = allow all.
 */
export function requirePage(...keys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const resolved = await permissionRepository.resolve(userId);
      if (resolved.isAdmin) return next();
      if (resolved.configured === false) return res.status(403).json({ message: "Forbidden" });
      const allowed = resolved.allowedPages ?? [];
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
  const userId = req.user?.userId ?? "";
  userRepository
    .findById(userId)
    .then((u) => ((u as { type?: string } | null)?.type === "admin" ? next() : res.status(403).json({ message: "Forbidden" })))
    .catch(() => res.status(403).json({ message: "Forbidden" }));
}
