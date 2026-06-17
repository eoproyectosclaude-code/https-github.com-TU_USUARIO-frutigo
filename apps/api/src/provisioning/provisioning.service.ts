import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { generateManifestRef, isValidWindow, type Port } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { buildManifestPdf } from './manifest-pdf';
import type { CreateProvisioningDto, CreateVesselDto } from './dto/provisioning.dto';

/**
 * Ship Provisioning — abastecimiento de buques en tránsito por el Canal de Panamá.
 * Diferenciador de FRUTI GO: ventanas de entrega certificadas y manifiesto digital.
 * Exento de ITBMS por la Ley 28/1995.
 */
@Injectable()
export class ProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

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

  private async buildPdf(id: string) {
    const data = await this.manifest(id);
    const buffer = await buildManifestPdf({
      manifestRef: data.manifestRef,
      reference: data.reference,
      issuedAt: data.issuedAt,
      vessel: data.vessel,
      port: data.port,
      deliveryWindow: data.deliveryWindow,
      legalBasis: data.legalBasis,
      items: data.items,
      totalItems: data.totalItems,
    });
    return { data, buffer };
  }

  /** Manifiesto en PDF (buffer) para descarga/compartir. */
  async manifestPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const { data, buffer } = await this.buildPdf(id);
    return { buffer, filename: `${data.manifestRef}.pdf` };
  }

  /** Envía el manifiesto por correo (a la naviera / agente). */
  async emailManifest(id: string, to: string) {
    if (!to) throw new BadRequestException('Falta el correo destino');
    const { data, buffer } = await this.buildPdf(id);
    const res = await this.mail.send({
      to,
      subject: `Manifiesto FRUTI GO · ${data.manifestRef} · ${data.vessel.name}`,
      text: `Adjuntamos el manifiesto digital ${data.manifestRef} para el buque ${data.vessel.name} (IMO ${data.vessel.imo}). Exento de ITBMS (Ley 28/1995).`,
      attachments: [{ filename: `${data.manifestRef}.pdf`, content: buffer, contentType: 'application/pdf' }],
    });
    return { ...res, to };
  }
}
