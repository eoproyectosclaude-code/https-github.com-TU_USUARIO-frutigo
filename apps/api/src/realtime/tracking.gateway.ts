import {
  type OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { DeliveryStatus, LatLng } from '@frutigo/shared';

/**
 * Gateway de tiempo real para seguimiento de entregas.
 * Los clientes (comprador) se unen a la sala `order:<orderId>` y reciben
 * actualizaciones de ubicación y estado emitidas por el repartidor.
 */
@WebSocketGateway({ namespace: '/tracking', cors: { origin: true } })
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TrackingGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`socket conectado: ${client.id}`);
  }

  /** El cliente se suscribe al seguimiento de un pedido. */
  @SubscribeMessage('track')
  onTrack(@MessageBody() orderId: string, @ConnectedSocket() client: Socket) {
    if (typeof orderId === 'string' && orderId) {
      client.join(`order:${orderId}`);
      return { joined: orderId };
    }
    return { joined: null };
  }

  /** Emite una nueva ubicación a los suscriptores del pedido. */
  emitLocation(orderId: string, location: LatLng & { at: string }) {
    this.server?.to(`order:${orderId}`).emit('location', location);
  }

  /** Emite un cambio de estado de la entrega. */
  emitStatus(orderId: string, status: DeliveryStatus) {
    this.server?.to(`order:${orderId}`).emit('status', { status });
  }
}
