import { logger } from "@/logger";
import { PLANS } from "@/adapters/stripe/stripe-billing-adapter";

export class GetPlansService {
  async execute() {
    try {
      logger.info("GetPlansService: starting...");
      const plans = PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.priceMonthly,
        seats: p.seats,
        features: [...p.features],
      }));
      logger.info("GetPlansService: completed");
      return plans;
    } catch (err) {
      logger.error(`GetPlansService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}
