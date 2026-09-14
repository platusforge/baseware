import { Router, Request, Response } from "express";
import { billingAdapter, mailAdapter } from "@/adapters";
import {
  subscriptionRepository,
  organizationRepository,
  membershipRepository,
  notificationRepository,
  auditRepository,
  webhookEventRepository,
} from "@/repositories";
import { HandleBillingWebhookService } from "@/services/billing-service/billing-service";
import { MiscController } from "@/controllers/saas-controller";
import { BillingPublicController } from "@/controllers/billing-public-controller";

const router = Router();
const misc = new MiscController();
const billingPublic = new BillingPublicController();
const webhookService = new HandleBillingWebhookService(
  subscriptionRepository,
  organizationRepository,
  membershipRepository,
  notificationRepository,
  auditRepository,
  webhookEventRepository,
  billingAdapter,
  mailAdapter,
);

router.get("/health", misc.health.bind(misc));
router.get("/billing/plans", billingPublic.plans.bind(billingPublic));

// Stripe webhook — public by design (Stripe signs the payload, no JWT).
// req.rawBody is captured by express.json({ verify }) in app.ts.
// Missing/invalid signature → 400 so Stripe retries. Never 500 here.
router.post("/billing/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) return res.status(400).json({ message: "Missing signature" });
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) return res.status(400).json({ message: "Missing raw body" });
    const event = billingAdapter.constructWebhookEvent(rawBody, signature);
    const result = await webhookService.execute(event);
    return res.json(result);
  } catch {
    return res.status(400).json({ message: "Webhook error" });
  }
});

export default router;
