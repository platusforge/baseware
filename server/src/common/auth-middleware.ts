import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt";
import { userRepository } from "@/repositories";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; jti: string };
      organizationId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  handle(req)
    .then((userId) => {
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      return next();
    })
    .catch(() => res.status(401).json({ message: "Unauthorized" }));
}

async function handle(req: Request): Promise<string | null> {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) return null;
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }
  // Deactivated users and pre-password-change tokens are rejected here,
  // so logout / ban / credential rotation take effect within one request.
  const user = await userRepository.findSessionUser(payload.sub);
  if (!user || user.active === false) return null;
  if (user.passwordChangedAt && payload.iat && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    return null;
  }
  req.user = { userId: payload.sub, jti: payload.jti };
  return payload.sub;
}
