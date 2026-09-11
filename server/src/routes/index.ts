import { Router } from "express";
import { authMiddleware } from "@/common/auth-middleware";
import authRoutes from "./auth-routes";
import saasRoutes from "./saas-routes";
import publicRoutes from "./public-routes";

export const routes = Router();

// 1. Public — no authentication (login/register/reset mount rate-limiters first)
routes.use(publicRoutes);
routes.use("/auth", authRoutes);

// 2. Global auth — all routes below require JWT from HttpOnly cookie
routes.use(authMiddleware);

// 3. Protected routes (requirePage only inside saas-routes for admin pages)
routes.use(saasRoutes);
