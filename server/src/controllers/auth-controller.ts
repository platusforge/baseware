import { Request, Response } from "express";
import { env } from "@/env";
import { RegisterService } from "@/services/auth-service/register-service";
import { LoginService } from "@/services/auth-service/login-service";
import { RefreshSessionService } from "@/services/auth-service/refresh-session-service";
import { RequestPasswordResetService, ConfirmPasswordResetService } from "@/services/auth-service/password-reset-service";
import { StartOAuthService } from "@/services/auth-service/start-oauth-service";
import { HandleOAuthCallbackService } from "@/services/auth-service/handle-oauth-callback-service";
import { userRepository, passwordHasher, refreshTokenRepository, passwordResetRepository, oauthAccountRepository, organizationRepository, membershipRepository, auditRepository } from "@/repositories";
import { mailAdapter, getOAuthAdapters, listOAuthProviders } from "@/adapters";
import { verifyToken } from "@/lib/jwt";

const registerService = new RegisterService(userRepository, passwordHasher);
const loginService = new LoginService(userRepository, passwordHasher, refreshTokenRepository);
const refreshService = new RefreshSessionService(refreshTokenRepository);
const requestResetService = new RequestPasswordResetService(userRepository, passwordResetRepository, mailAdapter);
const confirmResetService = new ConfirmPasswordResetService(userRepository, passwordResetRepository, passwordHasher, {} as never);
const startOAuthService = new StartOAuthService(getOAuthAdapters());
const handleOAuthCallbackService = new HandleOAuthCallbackService(
  getOAuthAdapters(),
  oauthAccountRepository,
  userRepository,
  organizationRepository,
  membershipRepository,
  refreshTokenRepository,
  auditRepository,
);

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await registerService.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      return res.status(400).json({ message: msg.replace("Error: ", "") });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await loginService.execute(req.body);
      res.cookie("accessToken", (result as { accessToken: string }).accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", (result as { refreshToken: string }).refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 3600 * 1000 });
      return res.json({ message: "Logged in." });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 401;
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      return res.status(status).json({ message: msg });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const result = await refreshService.execute(req.cookies?.refreshToken);
      res.cookie("accessToken", result.accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", result.refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 3600 * 1000 });
      return res.json({ message: "Refreshed." });
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.refreshToken as string | undefined;
      if (token) {
        try {
          const payload = verifyToken(token);
          await refreshTokenRepository.revokeJti(payload.jti);
        } catch { /* ignore */ }
      }
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });
      return res.json({ message: "Logged out." });
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const id = req.user?.userId;
      if (!id) throw new Error("Missing credentials.");
      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ message: "Not found" });
      return res.json(user);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  async requestReset(req: Request, res: Response) {
    try {
      const result = await requestResetService.execute(req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: "Error" });
    }
  }

  async confirmReset(req: Request, res: Response) {
    try {
      const result = await confirmResetService.execute(req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  oauthProviders(_req: Request, res: Response) {
    try {
      return res.json(listOAuthProviders());
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }

  async oauthStart(req: Request, res: Response) {
    try {
      const result = await startOAuthService.execute({ provider: req.params.provider });
      const tempOptions = { ...cookieOptions(), maxAge: 10 * 60 * 1000 };
      res.cookie("oauth_state", result.state, tempOptions);
      res.cookie("oauth_verifier", result.codeVerifier, tempOptions);
      return res.redirect(result.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      const code = msg === "OAuth provider not configured." ? "provider-unconfigured" : "oauth-failed";
      return res.redirect(`${env.FRONTEND_URL}/login?error=${code}`);
    }
  }

  async oauthCallback(req: Request, res: Response) {
    const clearTemp = () => {
      res.clearCookie("oauth_state", { path: "/" });
      res.clearCookie("oauth_verifier", { path: "/" });
    };
    try {
      const result = await handleOAuthCallbackService.execute({
        provider: req.params.provider,
        code: req.query.code,
        queryState: req.query.state,
        storedState: (req.cookies?.oauth_state as string | undefined) ?? "",
        codeVerifier: (req.cookies?.oauth_verifier as string | undefined) ?? "",
      });
      clearTemp();
      res.cookie("accessToken", result.accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", result.refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 3600 * 1000 });
      return res.redirect(`${env.FRONTEND_URL}/dashboard${result.isNewUser ? "?welcome=1" : ""}`);
    } catch (err) {
      clearTemp();
      const msg = err instanceof Error ? err.message : "Error";
      const code = msg.startsWith("An account with this email already exists") ? "account-exists" : "oauth-failed";
      return res.redirect(`${env.FRONTEND_URL}/login?error=${code}`);
    }
  }
}
