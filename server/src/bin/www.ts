import { createApp } from "@/app";
import { env } from "@/env";
import { logger } from "@/logger";

const app = createApp();

app.listen(env.SERVER_PORT, () => {
  logger.info(`Server listening on :${env.SERVER_PORT}`);
});
