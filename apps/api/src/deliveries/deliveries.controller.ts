import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import {
  AssignDeliveryDto,
  DriverStatusDto,
  PingDto,
  RegisterDriverDto,
  UpdateStatusDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  // --- Repartidor ---
  @Post('drivers/me')
  registerDriver(@CurrentUser() user: AuthUser, @Body() dto: RegisterDriverDto) {
    return this.deliveries.registerDriver(user.id, dto);
  }

  @Patch('drivers/me/status')
  setStatus(@CurrentUser() user: AuthUser, @Body() dto: DriverStatusDto) {
    return this.deliveries.setDriverStatus(user.id, dto);
  }

  @Get('deliveries/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.deliveries.myDeliveries(user.id);
  }

  @Patch('deliveries/:id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.deliveries.updateStatus(user.id, id, dto);
  }

  @Post('deliveries/:id/location')
  pushLocation(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: PingDto) {
    return this.deliveries.pushLocation(user.id, id, dto);
  }

  // --- Despacho (ADMIN) ---
  @Post('deliveries')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  assign(@Body() dto: AssignDeliveryDto) {
    return this.deliveries.assign(dto);
  }

  // --- Seguimiento (comprador autenticado) ---
  @Get('deliveries/track/:orderId')
  track(@Param('orderId') orderId: string) {
    return this.deliveries.track(orderId);
  }
}
