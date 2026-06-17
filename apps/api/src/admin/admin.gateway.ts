import { type OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { AdminService } from './admin.service';

/**
 * Gateway de métricas de administración en tiempo real.
 * Los clientes (dashboard web) se unen a la sala 'metrics' y reciben el
 * snapshot del dashboard al suscribirse y cada vez que cambia (pago, verificación).
 */
@WebSocketGateway({ namespace: '/admin', cors: { origin: true } })
export class AdminGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(AdminGateway.name);

  constructor(private readonly admin: AdminService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`admin socket conectado: ${client.id}`);
  }

  /** El dashboard pide el snapshot inicial y queda suscrito. */
  @SubscribeMessage('subscribe')
  async onSubscribe(client: Socket) {
    client.join('metrics');
    const metrics = await this.admin.dashboard();
    client.emit('metrics', metrics);
    return { subscribed: true };
  }

  /** Emite el snapshot actualizado a todos los dashboards conectados. */
  async broadcastMetrics() {
    if (!this.server) return;
    try {
      const metrics = await this.admin.dashboard();
      this.server.to('metrics').emit('metrics', metrics);
    } catch (err) {
      this.logger.warn(`No se pudo emitir métricas: ${(err as Error).message}`);
    }
  }
}
