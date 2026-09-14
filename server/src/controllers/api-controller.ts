import { Request, Response } from "express";
import { ListMembersService } from "@/services/organization-service/list-members-service";
import { ListAuditService } from "@/services/audit-service/list-audit-service";
import { TrackUsageService } from "@/services/usage-service/track-usage-service";
import { GetSubscriptionStatusService } from "@/services/admin-service/admin-service";
import { GetInvoicesService } from "@/services/billing-service/get-invoices-service";
import {
  membershipRepository,
  auditRepository,
  usageEventRepository,
  subscriptionRepository,
  organizationRepository,
} from "@/repositories";
import { billingAdapter } from "@/adapters";

const listMembersService = new ListMembersService(membershipRepository);
const listAuditService = new ListAuditService(auditRepository);
const trackUsageService = new TrackUsageService(usageEventRepository, membershipRepository);
const subStatusService = new GetSubscriptionStatusService(subscriptionRepository, organizationRepository);
const invoicesService = new GetInvoicesService(organizationRepository, billingAdapter);

function resolveOrgId(req: Request): string | undefined {
  const fromParams = req.params.orgId as string | undefined;
  const fromQuery = req.query.orgId as string | undefined;
  const fromBody = (req.body as { organizationId?: string } | undefined)?.organizationId;
  return req.organizationId ?? fromParams ?? fromQuery ?? fromBody;
}

export class ApiController {
  async members(req: Request, res: Response) {
    try {
      const organizationId = resolveOrgId(req);
      if (!organizationId) throw new Error("Missing organization.");
      if (req.organizationId && organizationId !== req.organizationId) throw new Error("Forbidden");
      const result = await listMembersService.execute({ organizationId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  async audit(req: Request, res: Response) {
    try {
      const organizationId = resolveOrgId(req);
      if (!organizationId) throw new Error("Missing organization.");
      if (req.organizationId && organizationId !== req.organizationId) throw new Error("Forbidden");
      const result = await listAuditService.execute({ organizationId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  async trackUsage(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const organizationId = resolveOrgId(req);
      if (!organizationId) throw new Error("Missing organization.");
      if (req.organizationId && organizationId !== req.organizationId) throw new Error("Forbidden");
      const result = await trackUsageService.execute(userId, { ...(req.body as object), organizationId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }

  async billingStatus(req: Request, res: Response) {
    try {
      const organizationId = resolveOrgId(req);
      if (!organizationId) throw new Error("Missing organization.");
      if (req.organizationId && organizationId !== req.organizationId) throw new Error("Forbidden");
      const result = await subStatusService.execute(organizationId);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: "Error" });
    }
  }

  async invoices(req: Request, res: Response) {
    try {
      const organizationId = resolveOrgId(req);
      if (!organizationId) throw new Error("Missing organization.");
      if (req.organizationId && organizationId !== req.organizationId) throw new Error("Forbidden");
      const result = await invoicesService.execute({ organizationId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: "Error" });
    }
  }
}
