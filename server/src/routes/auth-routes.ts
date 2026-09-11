import { Router } from "express";
import { AuthController } from "@/controllers/auth-controller";
import { authMiddleware } from "@/common/auth-middleware";
import { loginRateLimit, resetRateLimit, oauthRateLimit, registerRateLimit } from "@/common/rate-limit";

const router = Router();
const ctrl = new AuthController();

router.post("/register", registerRateLimit, ctrl.register.bind(ctrl));
router.post("/login", loginRateLimit, ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));
router.post("/logout", ctrl.logout.bind(ctrl));
router.post("/reset/request", resetRateLimit, ctrl.requestReset.bind(ctrl));
router.post("/reset/confirm", ctrl.confirmReset.bind(ctrl));
router.post("/verify/request", resetRateLimit, authMiddleware, ctrl.requestVerify.bind(ctrl));
router.post("/verify/confirm", ctrl.confirmVerify.bind(ctrl));
router.post("/password", authMiddleware, ctrl.changePassword.bind(ctrl));
router.delete("/account", authMiddleware, ctrl.deleteAccount.bind(ctrl));
router.get("/oauth/providers", ctrl.oauthProviders.bind(ctrl));
router.get("/oauth/:provider", oauthRateLimit, ctrl.oauthStart.bind(ctrl));
router.get("/oauth/:provider/callback", oauthRateLimit, ctrl.oauthCallback.bind(ctrl));
router.get("/me", authMiddleware, ctrl.me.bind(ctrl));

export default router;
