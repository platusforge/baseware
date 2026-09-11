import cron from "node-cron";
import { logger } from "@/logger";
import { prisma } from "@/prisma";

// Runs in a forked process in production (see bin/www schedule fork note).
// Periodic maintenance: purge expired tokens, roll up usage events.
export function startSchedule() {
  cron.schedule("0 * * * *", async () => {
    try {
      logger.info("Schedule: purging expired tokens...");
      await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      await prisma.invitation.deleteMany({ where: { expiresAt: { lt: new Date() }, acceptedAt: null } });
      logger.info("Schedule: purge complete");
    } catch (err) {
      logger.error(`Schedule error: ${err instanceof Error ? err.message : err}`);
    }
  });
}

if (require.main === module) {
  startSchedule();
}
