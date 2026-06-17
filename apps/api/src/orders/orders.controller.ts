import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Crea un pedido. Si hay sesión, queda ligado al usuario (checkout invitado permitido). */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.orders.create(dto, user?.id);
  }

  /** Pedidos del usuario autenticado. */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.findByUser(user.id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.orders.findOne(id);
  }
}
