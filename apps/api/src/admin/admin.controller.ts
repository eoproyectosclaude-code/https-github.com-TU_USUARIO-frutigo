import { Body, Controller, Get, Param, Patch, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { IsBoolean } from 'class-validator';
import { AdminService } from './admin.service';
import { AdminGateway } from './admin.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class SetVerifiedDto { @IsBoolean() verified!: boolean; }

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService, private readonly gateway: AdminGateway) {}

  @Get('dashboard') dashboard() { return this.admin.dashboard(); }
  @Get('suppliers') suppliers() { return this.admin.listSuppliers(); }

  @Patch('suppliers/:id/verify')
  async verify(@Param('id') id: string, @Body() dto: SetVerifiedDto) {
    const r = await this.admin.setVerified(id, dto.verified);
    void this.gateway.broadcastMetrics();
    return r;
  }

  @Get('payments') payments() { return this.admin.listPayments(); }
  @Get('deliveries/active') activeDeliveries() { return this.admin.activeDeliveries(); }

  @Get('reports/orders.csv')
  async ordersCsv(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="frutigo-pedidos.csv"');
    res.end('﻿' + (await this.admin.ordersCsv()));
  }

  @Get('reports/payments.csv')
  async paymentsCsv(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="frutigo-pagos.csv"');
    res.end('﻿' + (await this.admin.paymentsCsv()));
  }
}
