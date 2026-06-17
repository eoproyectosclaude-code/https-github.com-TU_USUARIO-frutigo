import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AdminService } from './admin.service';
import { AdminGateway } from './admin.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class SetVerifiedDto {
  @IsBoolean() verified!: boolean;
}

/** Panel de administración — solo rol ADMIN. */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly gateway: AdminGateway,
  ) {}

  @Get('dashboard')
  dashboard() { return this.admin.dashboard(); }

  @Get('suppliers')
  suppliers() { return this.admin.listSuppliers(); }

  @Patch('suppliers/:id/verify')
  async verify(@Param('id') id: string, @Body() dto: SetVerifiedDto) {
    const result = await this.admin.setVerified(id, dto.verified);
    void this.gateway.broadcastMetrics();
    return result;
  }

  @Get('payments')
  payments() { return this.admin.listPayments(); }

  @Get('deliveries/active')
  activeDeliveries() { return this.admin.activeDeliveries(); }
}
