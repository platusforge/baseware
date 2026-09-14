import { Request, Response } from "express";
import { CreateOrganizationService, InviteMemberService, AcceptInvitationService } from "@/services/organization-service/organization-service";
import { ListOrganizationsService } from "@/services/organization-service/list-organizations-service";
import { ListMembersService } from "@/services/organization-service/list-members-service";
import { DeleteOrganizationService, ResendInvitationService, RevokeInvitationService } from "@/services/account-service/account-service";
import { CreateCheckoutService, CreatePortalService } from "@/services/billing-service/billing-service";
import { GetInvoicesService } from "@/services/billing-service/get-invoices-service";
import { CreateApiKeyService, ListApiKeysService, RevokeApiKeyService } from "@/services/apikey-service/apikey-service";
import { GetAdminStatsService, ListNotificationsService, GetSubscriptionStatusService } from "@/services/admin-service/admin-service";
import { ListUsersService } from "@/services/admin-service/list-users-service";
import { ListAuditService } from "@/services/audit-service/list-audit-service";
import { MarkNotificationReadService } from "@/services/notification-service/mark-notification-read-service";
import { GetUploadUrlService } from "@/services/storage-service/get-upload-url-service";
import { TrackUsageService } from "@/services/usage-service/track-usage-service";
import { GetProfileService } from "@/services/account-service/get-profile-service";
import { organizationRepository, membershipRepository, invitationRepository, auditRepository, userRepository, subscriptionRepository, apiKeyRepository, notificationRepository, usageEventRepository, permissionRepository } from "@/repositories";
import { billingAdapter, mailAdapter, storageAdapter } from "@/adapters";

const createOrgService = new CreateOrganizationService(organizationRepository, membershipRepository, auditRepository, subscriptionRepository);
const listOrgsService = new ListOrganizationsService(organizationRepository);
const listMembersService = new ListMembersService(membershipRepository);
const listAuditService = new ListAuditService(auditRepository);
const markReadService = new MarkNotificationReadService(notificationRepository);
const listUsersService = new ListUsersService(userRepository);
const getInvoicesService = new GetInvoicesService(organizationRepository, billingAdapter);
const getProfileService = new GetProfileService(userRepository, permissionRepository);

const inviteService = new InviteMemberService(invitationRepository, membershipRepository, mailAdapter, organizationRepository);
const acceptService = new AcceptInvitationService(invitationRepository, membershipRepository, userRepository);
const deleteOrgService = new DeleteOrganizationService(organizationRepository, membershipRepository, auditRepository);
const resendInviteService = new ResendInvitationService(invitationRepository, membershipRepository, mailAdapter);
const revokeInviteService = new RevokeInvitationService(invitationRepository, membershipRepository);
const checkoutService = new CreateCheckoutService(billingAdapter, organizationRepository);
const portalService = new CreatePortalService(billingAdapter, organizationRepository);
const subStatusService = new GetSubscriptionStatusService(subscriptionRepository, organizationRepository);
const createKeyService = new CreateApiKeyService(apiKeyRepository, auditRepository, membershipRepository, organizationRepository);
const listKeysService = new ListApiKeysService(apiKeyRepository);
const revokeKeyService = new RevokeApiKeyService(apiKeyRepository);
const adminStatsService = new GetAdminStatsService(userRepository, auditRepository);
const notificationsService = new ListNotificationsService(notificationRepository);
const uploadUrlService = new GetUploadUrlService(storageAdapter, membershipRepository);
const trackUsageService = new TrackUsageService(usageEventRepository, membershipRepository);

export class OrganizationController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await createOrgService.execute(userId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await listOrgsService.execute(userId);
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async members(req: Request, res: Response) {
    try {
      const orgId = req.params.orgId ?? req.organizationId;
      if (!orgId) throw new Error("Missing organization.");
      const result = await listMembersService.execute({ organizationId: orgId });
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async invite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.params.orgId ?? req.organizationId;
      if (!userId || !orgId) throw new Error("Missing credentials.");
      const result = await inviteService.execute(userId, orgId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async accept(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await acceptService.execute({ token: (req.body as { token: string }).token, userId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async remove(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.params.orgId ?? req.organizationId;
      if (!userId || !orgId) throw new Error("Missing credentials.");
      const result = await deleteOrgService.execute(userId, orgId);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async resendInvite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.params.orgId ?? req.organizationId;
      if (!userId || !orgId) throw new Error("Missing credentials.");
      const result = await resendInviteService.execute(userId, orgId, req.params.id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async revokeInvite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.params.orgId ?? req.organizationId;
      if (!userId || !orgId) throw new Error("Missing credentials.");
      const result = await revokeInviteService.execute(userId, orgId, req.params.id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
}

export class BillingController {
  async checkout(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const profile = (await getProfileService.execute(userId)) as { email: string; name: string | null };
      // req.organizationId was verified by requireOrgRole; the body value must match it.
      const bodyOrg = (req.body as { organizationId?: string }).organizationId;
      if (bodyOrg && bodyOrg !== req.organizationId) throw new Error("Forbidden");
      const organizationId = req.organizationId ?? bodyOrg;
      if (!organizationId) throw new Error("Missing organization.");
      const result = await checkoutService.execute(
        { userId, email: profile.email, name: profile.name ?? profile.email },
        { ...(req.body as object), organizationId },
      );
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async portal(req: Request, res: Response) {
    try {
      const orgId = req.organizationId ?? (req.body as { organizationId?: string }).organizationId;
      if (!orgId) throw new Error("Missing organization.");
      if (req.organizationId && (req.body as { organizationId?: string }).organizationId && (req.body as { organizationId?: string }).organizationId !== req.organizationId) {
        throw new Error("Forbidden");
      }
      const result = await portalService.execute(orgId);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async status(req: Request, res: Response) {
    try {
      const orgId = req.organizationId ?? req.params.orgId ?? (req.query.orgId as string);
      if (!orgId) throw new Error("Missing organization.");
      const result = await subStatusService.execute(orgId);
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async invoices(req: Request, res: Response) {
    try {
      const orgId = req.organizationId ?? (req.query.orgId as string);
      if (!orgId) throw new Error("Missing organization.");
      return res.json(await getInvoicesService.execute({ organizationId: orgId }));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
}

export class ApiKeyController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await createKeyService.execute(userId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      return res.json(await listKeysService.execute(userId));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async revoke(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await revokeKeyService.execute(userId, req.params.id);
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
}

export class MiscController {
  async health(_req: Request, res: Response) {
    return res.json({ ok: true, version: "1.0.0" });
  }
  async adminStats(_req: Request, res: Response) {
    try {
      return res.json(await adminStatsService.execute());
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async notifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      return res.json(await notificationsService.execute(userId));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async readNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const result = await markReadService.execute(userId, { id: req.params.id });
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async audit(req: Request, res: Response) {
    try {
      const orgId = req.params.orgId ?? req.organizationId;
      if (!orgId) throw new Error("Missing organization.");
      return res.json(await listAuditService.execute({ organizationId: orgId }));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async uploadUrl(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const organizationId = req.organizationId ?? (req.body as { organizationId?: string }).organizationId;
      if (!organizationId) throw new Error("Missing organization.");
      const body = req.body as { fileName?: string; key?: string; contentType?: string; contentLength?: number };
      const result = await uploadUrlService.execute(userId, {
        organizationId,
        fileName: body.fileName ?? body.key ?? "upload",
        contentType: body.contentType ?? "application/octet-stream",
        contentLength: body.contentLength,
      });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async trackUsage(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Missing credentials.");
      const organizationId = req.organizationId ?? (req.body as { organizationId?: string }).organizationId;
      const result = await trackUsageService.execute(userId, { ...(req.body as object), organizationId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
    }
  }
  async users(req: Request, res: Response) {
    try {
      return res.json(await listUsersService.execute({ take: req.query.take, skip: req.query.skip, search: req.query.search }));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
}
