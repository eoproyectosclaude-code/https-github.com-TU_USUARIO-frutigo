import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Registra (o actualiza) el push token de un dispositivo del usuario. */
  async registerToken(userId: string, token: string) {
    await this.prisma.pushToken.upsert({
      where: { token },
      update: { userId },
      create: { userId, token },
    });
    return { ok: true };
  }

  /** Envía una notificación push a todos los dispositivos de un usuario. */
  async notifyUser(userId: string | null | undefined, title: string, body: string, data?: Record<string, unknown>) {
    if (!userId) return;
    const tokens = await this.prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
    if (tokens.length === 0) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }));

    try {
      await axios.post(EXPO_PUSH_URL, messages, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10_000,
      });
    } catch (err) {
      // No interrumpe el flujo de negocio si el push falla.
      this.logger.warn(`Push a ${userId} falló: ${(err as Error).message}`);
    }
  }
}
