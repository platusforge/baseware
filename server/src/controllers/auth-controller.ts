import { Request, Response } from "express";
import { env } from "@/env";
import { RegisterService } from "@/services/auth-service/register-service";
import { LoginService } from "@/services/auth-service/login-service";
import { RefreshSessionService } from "@/services/auth-service/refresh-session-service";
import { RequestPasswordResetService, ConfirmPasswordResetService } from "@/services/auth-service/password-reset-service";
import { StartOAuthService } from "@/services/auth-service/start-oauth-service";
import { HandleOAuthCallbackService } from "@/services/auth-service/handle-oauth-callback-service";
import { RequestEmailVerificationService, ConfirmEmailVerificationService } from "@/services/auth-service/email-verification-service";
import { ChangePasswordService, DeleteAccountService } from "@/services/account-service/account-service";
import { GetPermissionsService } from "@/services/permission-service/get-permissions-service";
import { userRepository, passwordHasher, refreshTokenRepository, passwordResetRepository, oauthAccountRepository, organizationRepository, membershipRepository, auditRepository, permissionRepository } from "@/repositories";
import { mailAdapter, getOAuthAdapters, listOAuthProviders } from "@/adapters";
import { verifyToken, accessCookieMaxAge, refreshCookieMaxAge } from "@/lib/jwt";

const registerService = new RegisterService(userRepository, passwordHasher, mailAdapter);
const loginService = new LoginService(userRepository, passwordHasher, refreshTokenRepository);
const refreshService = new RefreshSessionService(refreshTokenRepository, userRepository);
const requestResetService = new RequestPasswordResetService(userRepository, passwordResetRepository, mailAdapter);
const confirmResetService = new ConfirmPasswordResetService(userRepository, passwordResetRepository, passwordHasher, refreshTokenRepository);
const requestVerifyService = new RequestEmailVerificationService(userRepository, mailAdapter);
const confirmVerifyService = new ConfirmEmailVerificationService(userRepository);
const changePasswordService = new ChangePasswordService(userRepository, passwordHasher, refreshTokenRepository);
const deleteAccountService = new DeleteAccountService(userRepository, passwordHasher);
const getPermissionsService = new GetPermissionsService(permissionRepository);
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

/** clearCookie only removes a cookie when domain/secure/sameSite/path match. */
function clearCookieOptions() {
  const { ...rest } = cookieOptions();
  return rest;
}

function setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, { ...cookieOptions(), maxAge: accessCookieMaxAge() });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions(), maxAge: refreshCookieMaxAge() });
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
      setSessionCookies(res, (result as { accessToken: string }).accessToken, (result as { refreshToken: string }).refreshToken);
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
      setSessionCookies(res, result.accessToken, result.refreshToken);
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
      res.clearCookie("accessToken", clearCookieOptions());
      res.clearCookie("refreshToken", clearCookieOptions());
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
      const permissions = await getPermissionsService.execute(id);
      return res.json({ ...user, permissions });
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

  async requestVerify(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await requestVerifyService.execute(userId);
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }

  async confirmVerify(req: Request, res: Response) {
    try {
      const result = await confirmVerifyService.execute(req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await changePasswordService.execute(userId, req.body);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await deleteAccountService.execute(userId, req.body);
      res.clearCookie("accessToken", clearCookieOptions());
      res.clearCookie("refreshToken", clearCookieOptions());
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
      res.clearCookie("oauth_state", clearCookieOptions());
      res.clearCookie("oauth_verifier", clearCookieOptions());
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
      setSessionCookies(res, result.accessToken, result.refreshToken);
      return res.redirect(`${env.FRONTEND_URL}/dashboard${result.isNewUser ? "?welcome=1" : ""}`);
    } catch (err) {
      clearTemp();
      const msg = err instanceof Error ? err.message : "Error";
      const code = msg.startsWith("An account with this email already exists") ? "account-exists" : "oauth-failed";
      return res.redirect(`${env.FRONTEND_URL}/login?error=${code}`);
    }
  }
}
