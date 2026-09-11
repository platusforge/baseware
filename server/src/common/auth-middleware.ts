import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; jti: string };
      organizationId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const payload = verifyToken(token);
    req.user = { userId: payload.sub, jti: payload.jti };
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
