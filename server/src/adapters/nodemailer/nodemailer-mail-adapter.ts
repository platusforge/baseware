import nodemailer from "nodemailer";
import { env } from "@/env";
import { logger } from "@/logger";
import { IMailAdapter } from "../adapters";

export class NodemailerMailAdapter implements IMailAdapter {
  async sendMail(data: { to: string; subject: string; html: string }): Promise<void> {
    if (!env.SMTP_HOST) {
      logger.warn(`Mail suppressed (no SMTP_HOST) to=${data.to} subject=${data.subject}`);
      return;
    }
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({ from: env.EMAIL_FROM, to: data.to, subject: data.subject, html: data.html });
  }
}
