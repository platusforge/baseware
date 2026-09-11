import { Router } from "express";
import { AuthController } from "@/controllers/auth-controller";
import { authMiddleware } from "@/common/auth-middleware";
import { loginRateLimit, resetRateLimit, oauthRateLimit } from "@/common/rate-limit";

const router = Router();
const ctrl = new AuthController();

router.post("/register", ctrl.register.bind(ctrl));
router.post("/login", loginRateLimit, ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));
router.post("/logout", ctrl.logout.bind(ctrl));
router.post("/reset/request", resetRateLimit, ctrl.requestReset.bind(ctrl));
router.post("/reset/confirm", ctrl.confirmReset.bind(ctrl));
router.get("/oauth/providers", ctrl.oauthProviders.bind(ctrl));
router.get("/oauth/:provider", oauthRateLimit, ctrl.oauthStart.bind(ctrl));
router.get("/oauth/:provider/callback", oauthRateLimit, ctrl.oauthCallback.bind(ctrl));
router.get("/me", authMiddleware, ctrl.me.bind(ctrl));

export default router;
