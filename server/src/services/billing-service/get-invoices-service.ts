import { z } from "zod";
import { logger } from "@/logger";
import { IOrganizationRepository } from "@/types/repositories/saas-repositories";
import { IBillingAdapter } from "@/adapters/adapters";

const schema = z.object({ organizationId: z.string().uuid() });

export class GetInvoicesService {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly billingAdapter: IBillingAdapter,
  ) {}

  async execute(input: unknown) {
    try {
      logger.info("GetInvoicesService: starting...");
      const data = schema.parse(input);
      const org = (await this.organizationRepository.findById(data.organizationId)) as {
        stripeCustomerId: string | null;
      } | null;
      if (!org?.stripeCustomerId) {
        logger.info("GetInvoicesService: completed");
        return [];
      }
      if (typeof this.billingAdapter.listInvoices !== "function") {
        logger.info("GetInvoicesService: completed");
        return [];
      }
      const result = await this.billingAdapter.listInvoices(org.stripeCustomerId);
      logger.info("GetInvoicesService: completed");
      return result;
    } catch (err) {
      logger.error(`GetInvoicesService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}
