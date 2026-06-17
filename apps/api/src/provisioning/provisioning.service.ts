import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { generateManifestRef, isValidWindow, type Port } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProvisioningDto, CreateVesselDto } from './dto/provisioning.dto';

/**
 * Ship Provisioning — abastecimiento de buques en tránsito por el Canal de Panamá.
 * Diferenciador de FRUTI GO: ventanas de entrega certificadas en puerto y
 * manifiesto digital. Exento de ITBMS por la Ley 28/1995.
 */
@Injectable()
export class ProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  createVessel(userId: string | undefined, dto: CreateVesselDto) {
    return this.prisma.vessel.create({ data: { ...dto, userId: userId ?? null } });
  }

  listVessels(userId?: string) {
    return this.prisma.vessel.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(userId: string | undefined, dto: CreateProvisioningDto) {
    if (!isValidWindow(dto.windowStart, dto.windowEnd)) {
      throw new BadRequestException('La ventana de entrega es inválida (fin debe ser posterior al inicio).');
    }
    if (dto.lines.length === 0) {
      throw new BadRequestException('El manifiesto no tiene productos.');
    }

    const vessel = await this.prisma.vessel.findUnique({ where: { id: dto.vesselId } });
    if (!vessel) throw new NotFoundException('Buque no encontrado');

    // Resuelve nombres de producto desde la base.
    const lines = [];
    for (const l of dto.lines) {
      const product = await this.prisma.product.findUnique({ where: { id: l.productId } });
      if (!product) throw new BadRequestException(`Producto no encontrado: ${l.productId}`);
      if (!product.shipProvisioning) {
        throw new BadRequestException(`${product.nameEs} no está habilitado para Ship Provisioning.`);
      }
      lines.push({
        productId: l.productId,
        productName: product.nameEs,
        unit: l.unit as any,
        quantity: l.quantity,
      });
    }

    const reference = `SP-${Date.now()}`;
    const manifestRef = generateManifestRef(dto.port as Port);

    return this.prisma.provisioningRequest.create({
      data: {
        reference,
        vesselId: dto.vesselId,
        port: dto.port as any,
        windowStart: new Date(dto.windowStart),
        windowEnd: new Date(dto.windowEnd),
        status: 'SOLICITADO',
        manifestRef,
        taxExempt: true,
        userId: userId ?? null,
        lines: { create: lines },
      },
      include: { lines: true, vessel: true },
    });
  }

  listRequests(userId?: string) {
    return this.prisma.provisioningRequest.findMany({
      where: userId ? { userId } : undefined,
      include: { lines: true, vessel: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async manifest(id: string) {
    const req = await this.prisma.provisioningRequest.findUnique({
      where: { id },
      include: { lines: true, vessel: true },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');

    // Manifiesto digital listo para presentar en puerto / a la naviera.
    return {
      manifestRef: req.manifestRef,
      reference: req.reference,
      issuedAt: new Date().toISOString(),
      vessel: { name: req.vessel.name, imo: req.vessel.imo, flag: req.vessel.flag, agent: req.vessel.agent },
      port: req.port,
      deliveryWindow: { start: req.windowStart, end: req.windowEnd },
      taxExempt: req.taxExempt,
      legalBasis: 'Ley 28/1995 — buque en tránsito internacional, exento de ITBMS',
      items: req.lines.map((l) => ({ product: l.productName, unit: l.unit, quantity: l.quantity })),
      totalItems: req.lines.reduce((n, l) => n + l.quantity, 0),
    };
  }
}
