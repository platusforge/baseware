import { Router } from "express";
import { OrganizationController, BillingController, ApiKeyController, MiscController } from "@/controllers/saas-controller";
import { requireOrgRole } from "@/common/org-middleware";
import { requireAdmin, requirePage } from "@/common/require-page";

const router = Router();
const org = new OrganizationController();
const billing = new BillingController();
const keys = new ApiKeyController();
const misc = new MiscController();

router.post("/organizations", org.create.bind(org));
router.get("/organizations", org.list.bind(org));
router.post("/invitations/accept", org.accept.bind(org));
router.delete("/organizations/:orgId", requireOrgRole("owner"), org.remove.bind(org));
router.get("/organizations/:orgId/members", requireOrgRole(), org.members.bind(org));
router.post("/organizations/:orgId/invitations", requireOrgRole("owner", "admin"), org.invite.bind(org));
router.post("/organizations/:orgId/invitations/:id/resend", requireOrgRole("owner", "admin"), org.resendInvite.bind(org));
router.delete("/organizations/:orgId/invitations/:id", requireOrgRole("owner", "admin"), org.revokeInvite.bind(org));

router.post("/billing/checkout", requireOrgRole("owner", "admin"), billing.checkout.bind(billing));
router.post("/billing/portal", requireOrgRole("owner", "admin"), billing.portal.bind(billing));
router.get("/billing/status", requireOrgRole(), billing.status.bind(billing));

router.post("/api-keys", keys.create.bind(keys));
router.get("/api-keys", keys.list.bind(keys));
router.delete("/api-keys/:id", keys.revoke.bind(keys));

router.get("/notifications", misc.notifications.bind(misc));
router.post("/notifications/:id/read", misc.readNotification.bind(misc));
router.get("/organizations/:orgId/audit", requireOrgRole("owner", "admin"), misc.audit.bind(misc));
router.post("/uploads/url", misc.uploadUrl.bind(misc));

// Admin — RBAC page guard + admin flag
router.get("/admin/stats", requirePage("admin"), requireAdmin, misc.adminStats.bind(misc));
router.get("/admin/users", requirePage("admin"), requireAdmin, misc.users.bind(misc));

export default router;
