import { Request, Response } from "express";
import { CreateOrganizationService, InviteMemberService, AcceptInvitationService } from "@/services/organization-service/organization-service";
import { DeleteOrganizationService, ResendInvitationService, RevokeInvitationService } from "@/services/account-service/account-service";
import { CreateCheckoutService, CreatePortalService } from "@/services/billing-service/billing-service";
import { CreateApiKeyService, ListApiKeysService, RevokeApiKeyService } from "@/services/apikey-service/apikey-service";
import { GetAdminStatsService, ListNotificationsService, GetSubscriptionStatusService } from "@/services/admin-service/admin-service";
import { organizationRepository, membershipRepository, invitationRepository, auditRepository, userRepository, subscriptionRepository, apiKeyRepository, notificationRepository } from "@/repositories";
import { billingAdapter, mailAdapter, storageAdapter } from "@/adapters";

const createOrgService = new CreateOrganizationService(organizationRepository, membershipRepository, auditRepository);
const inviteService = new InviteMemberService(invitationRepository, membershipRepository, mailAdapter, organizationRepository);
const acceptService = new AcceptInvitationService(invitationRepository, membershipRepository, userRepository);
const deleteOrgService = new DeleteOrganizationService(organizationRepository, membershipRepository, auditRepository);
const resendInviteService = new ResendInvitationService(invitationRepository, membershipRepository, mailAdapter);
const revokeInviteService = new RevokeInvitationService(invitationRepository, membershipRepository);
const checkoutService = new CreateCheckoutService(billingAdapter, organizationRepository);
const portalService = new CreatePortalService(billingAdapter, organizationRepository);
const subStatusService = new GetSubscriptionStatusService(subscriptionRepository, organizationRepository);
const createKeyService = new CreateApiKeyService(apiKeyRepository, auditRepository, membershipRepository);
const listKeysService = new ListApiKeysService(apiKeyRepository);
const revokeKeyService = new RevokeApiKeyService(apiKeyRepository);
const adminStatsService = new GetAdminStatsService(userRepository, auditRepository);
const notificationsService = new ListNotificationsService(notificationRepository);

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
      const result = await organizationRepository.listForUser(userId);
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async members(req: Request, res: Response) {
    try {
      const orgId = req.params.orgId ?? req.organizationId;
      if (!orgId) throw new Error("Missing organization.");
      const result = await membershipRepository.listMembers(orgId);
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
      const user = (await userRepository.findById(userId)) as { email: string; name: string | null };
      // req.organizationId was verified by requireOrgRole; the body value must match it.
      const bodyOrg = (req.body as { organizationId?: string }).organizationId;
      if (bodyOrg && bodyOrg !== req.organizationId) throw new Error("Forbidden");
      const organizationId = req.organizationId ?? bodyOrg;
      if (!organizationId) throw new Error("Missing organization.");
      const result = await checkoutService.execute(
        { userId, email: user.email, name: user.name ?? user.email },
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
      await notificationRepository.markRead(req.params.id, userId);
      return res.json({ read: true });
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async audit(req: Request, res: Response) {
    try {
      const orgId = req.params.orgId ?? req.organizationId;
      if (!orgId) throw new Error("Missing organization.");
      return res.json(await auditRepository.list(orgId));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async uploadUrl(req: Request, res: Response) {
    try {
      const body = req.body as { key: string; contentType: string };
      if (!body.key || typeof body.key !== "string" || body.key.length > 256) throw new Error("Invalid key.");
      if (body.key.includes("..") || body.key.startsWith("/") || body.key.startsWith("\\")) {
        throw new Error("Invalid key.");
      }
      return res.json(await storageAdapter.getUploadUrl({ key: body.key, contentType: body.contentType ?? "application/octet-stream" }));
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
  async users(req: Request, res: Response) {
    try {
      const take = Math.min(Math.max(Number(req.query.take ?? 20) || 20, 1), 100);
      const skip = Math.max(Number(req.query.skip ?? 0) || 0, 0);
      const search = req.query.search as string | undefined;
      const [items, total] = await Promise.all([userRepository.list({ take, skip, search }), userRepository.count({ search })]);
      return res.json({ items, total });
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
}
