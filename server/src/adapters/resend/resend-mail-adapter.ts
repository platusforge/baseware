import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/logger";
import { IMailAdapter } from "../adapters";

export class ResendMailAdapter implements IMailAdapter {
  async sendMail(data: { to: string; subject: string; html: string }): Promise<void> {
    if (!env.RESEND_API_KEY) {
      logger.warn(`Mail suppressed (no RESEND_API_KEY) to=${data.to} subject=${data.subject}`);
      return;
    }
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }
}
