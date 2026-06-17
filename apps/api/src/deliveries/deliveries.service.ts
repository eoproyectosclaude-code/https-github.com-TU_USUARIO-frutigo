import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canAdvance, etaMinutes, type DeliveryStatus, type LatLng } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../realtime/tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  AssignDeliveryDto,
  DriverStatusDto,
  PingDto,
  RegisterDriverDto,
  UpdateStatusDto,
} from './dto/delivery.dto';

const STATUS_MSG: Record<string, { es: string }> = {
  RECOGIDO: { es: 'Tu pedido fue recogido y está en preparación.' },
  EN_RUTA: { es: '¡Tu pedido va en camino! Sigue al repartidor en vivo.' },
  ENTREGADO: { es: 'Tu pedido fue entregado. ¡Buen provecho!' },
  FALLIDO: { es: 'Hubo un problema con la entrega. Te contactaremos.' },
};

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tracking: TrackingGateway,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Repartidor (perfil) ---
  async registerDriver(userId: string, dto: RegisterDriverDto) {
    return this.prisma.driver.upsert({
      where: { userId },
      update: { name: dto.name, vehicle: dto.vehicle as any, plate: dto.plate },
      create: {
        userId,
        name: dto.name,
        vehicle: dto.vehicle as any,
        plate: dto.plate,
        status: 'DISPONIBLE',
      },
    });
  }

  private async driverOf(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Tu cuenta no tiene perfil de repartidor');
    return driver;
  }

  async setDriverStatus(userId: string, dto: DriverStatusDto) {
    const driver = await this.driverOf(userId);
    return this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: dto.status as any,
        lat: dto.lat ?? driver.lat,
        lng: dto.lng ?? driver.lng,
        lastSeenAt: new Date(),
      },
    });
  }

  // --- Despacho (ADMIN) ---
  async assign(dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { delivery: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.delivery) throw new BadRequestException('El pedido ya tiene una entrega asignada');
    if (order.status !== 'PAGADO') {
      throw new BadRequestException('Solo se asignan entregas de pedidos PAGADOS');
    }
    const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException('Repartidor no encontrado');

    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: dto.orderId,
        driverId: dto.driverId,
        status: 'ASIGNADO',
        pickupAddress: dto.pickupAddress,
        dropoffAddress: dto.dropoffAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
      },
    });
    await this.prisma.order.update({ where: { id: dto.orderId }, data: { status: 'EN_RUTA' } });
    return delivery;
  }

  async myDeliveries(userId: string) {
    const driver = await this.driverOf(userId);
    return this.prisma.delivery.findMany({
      where: { driverId: driver.id },
      include: { order: { select: { reference: true, totalUsd: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Avanza el estado validando la máquina de estados (dominio compartido). */
  async updateStatus(userId: string, deliveryId: string, dto: UpdateStatusDto) {
    const driver = await this.driverOf(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Entrega no encontrada');
    if (delivery.driverId !== driver.id) {
      throw new ForbiddenException('Esta entrega no está asignada a ti');
    }

    const current = delivery.status as DeliveryStatus;
    const next = dto.status;
    if (!canAdvance(current, next)) {
      throw new BadRequestException(`Transición inválida: ${current} → ${next}`);
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: next as any },
      include: { order: { select: { reference: true, userId: true } } },
    });

    // Sincroniza el estado del pedido.
    if (next === 'ENTREGADO') {
      await this.prisma.order.update({ where: { id: delivery.orderId }, data: { status: 'ENTREGADO' } });
      await this.prisma.driver.update({ where: { id: driver.id }, data: { status: 'DISPONIBLE' } });
    } else if (next === 'EN_RUTA') {
      await this.prisma.driver.update({ where: { id: driver.id }, data: { status: 'EN_RUTA' } });
    }

    // Tiempo real + push al comprador.
    this.tracking.emitStatus(delivery.orderId, next);
    const msg = STATUS_MSG[next];
    if (msg) {
      void this.notifications.notifyUser(updated.order.userId, `Pedido ${updated.order.reference}`, msg.es, {
        orderId: delivery.orderId,
        status: next,
      });
    }
    return updated;
  }

  /** Registra un ping GPS y actualiza la posición del repartidor. */
  async pushLocation(userId: string, deliveryId: string, dto: PingDto) {
    const driver = await this.driverOf(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.driverId !== driver.id) {
      throw new ForbiddenException('Entrega no asignada a ti');
    }
    await this.prisma.deliveryLocation.create({
      data: { deliveryId, lat: dto.lat, lng: dto.lng },
    });
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { lat: dto.lat, lng: dto.lng, lastSeenAt: new Date() },
    });
    // Transmite la ubicación en vivo a los suscriptores del pedido.
    this.tracking.emitLocation(delivery.orderId, { lat: dto.lat, lng: dto.lng, at: new Date().toISOString() });
    return { ok: true };
  }

  /** Seguimiento para el comprador: estado, última ubicación y ETA. */
  async track(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: {
        order: { select: { reference: true } },
        locations: { orderBy: { at: 'desc' }, take: 1 },
        driver: { select: { name: true, vehicle: true } },
      },
    });
    if (!delivery) throw new NotFoundException('Este pedido aún no tiene entrega');

    const last = delivery.locations[0];
    let eta: number | null = null;
    if (last && delivery.dropoffLat != null && delivery.dropoffLng != null) {
      const from: LatLng = { lat: last.lat, lng: last.lng };
      const to: LatLng = { lat: delivery.dropoffLat, lng: delivery.dropoffLng };
      eta = etaMinutes(from, to);
    }

    return {
      reference: delivery.order.reference,
      status: delivery.status,
      driver: delivery.driver ? { name: delivery.driver.name, vehicle: delivery.driver.vehicle } : null,
      lastLocation: last ? { lat: last.lat, lng: last.lng, at: last.at } : null,
      dropoff:
        delivery.dropoffLat != null && delivery.dropoffLng != null
          ? { lat: delivery.dropoffLat, lng: delivery.dropoffLng }
          : null,
      etaMinutes: eta,
    };
  }
}
