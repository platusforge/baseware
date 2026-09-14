import { Router } from "express";
import { apiKeyMiddleware, requireApiScopes } from "@/common/org-middleware";
import { ApiController } from "@/controllers/api-controller";

const router = Router();
const ctrl = new ApiController();

// Machine-to-machine API, authenticated via x-api-key (no cookies/JWT).
// Every route requires explicit scopes granted at key creation time.
// The key is bound to one organization: cross-org reads are rejected in the controller.
router.get("/organizations/:orgId/members", apiKeyMiddleware, requireApiScopes("members:read"), ctrl.members.bind(ctrl));
router.get(
  "/organizations/:orgId/audit",
  apiKeyMiddleware,
  requireApiScopes("audit:read"),
  ctrl.audit.bind(ctrl),
);
router.post("/usage/events", apiKeyMiddleware, requireApiScopes("usage:write"), ctrl.trackUsage.bind(ctrl));
router.get("/billing/status", apiKeyMiddleware, requireApiScopes("billing:read"), ctrl.billingStatus.bind(ctrl));
router.get("/billing/invoices", apiKeyMiddleware, requireApiScopes("billing:read"), ctrl.invoices.bind(ctrl));

export default router;
