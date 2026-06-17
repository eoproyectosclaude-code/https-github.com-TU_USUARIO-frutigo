import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/**
 * Servicio de correo. Usa SMTP por variables de entorno; si no está configurado,
 * registra el envío en el log (no rompe el flujo, útil en dev).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    this.from = process.env.MAIL_FROM ?? 'FRUTI GO <no-reply@frutigo.pa>';
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
    } else {
      this.logger.warn('SMTP_HOST no configurado — los correos se registran en el log (modo dev).');
    }
  }

  async send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: MailAttachment[];
  }): Promise<{ sent: boolean }> {
    if (!this.transporter) {
      this.logger.log(
        `📧 [DEV] Para: ${opts.to} · Asunto: "${opts.subject}" · Adjuntos: ${
          opts.attachments?.map((a) => a.filename).join(', ') || 'ninguno'
        }`,
      );
      return { sent: false };
    }

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
    this.logger.log(`📧 Enviado a ${opts.to}: ${opts.subject}`);
    return { sent: true };
  }
}
