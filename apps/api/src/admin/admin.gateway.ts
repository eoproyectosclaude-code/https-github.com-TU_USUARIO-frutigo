import { type OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { AdminService } from './admin.service';

/** Gateway de métricas y entregas del dashboard en tiempo real. */
@WebSocketGateway({ namespace: '/admin', cors: { origin: true } })
export class AdminGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(AdminGateway.name);

  constructor(private readonly admin: AdminService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`admin socket conectado: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  async onSubscribe(client: Socket) {
    client.join('metrics');
    const [metrics, deliveries] = await Promise.all([this.admin.dashboard(), this.admin.activeDeliveries()]);
    client.emit('metrics', metrics);
    client.emit('deliveries', deliveries);
    return { subscribed: true };
  }

  async broadcastMetrics() {
    if (!this.server) return;
    try { this.server.to('metrics').emit('metrics', await this.admin.dashboard()); }
    catch (err) { this.logger.warn(`métricas: ${(err as Error).message}`); }
  }

  async broadcastDeliveries() {
    if (!this.server) return;
    try { this.server.to('metrics').emit('deliveries', await this.admin.activeDeliveries()); }
    catch (err) { this.logger.warn(`entregas: ${(err as Error).message}`); }
  }
}
