import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.orders.create(dto, user?.id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.findByUser(user.id);
  }

  /** Recibo del pedido en PDF (solo dueño o ADMIN). */
  @Get(':id/receipt.pdf')
  @UseGuards(JwtAuthGuard)
  async receipt(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const { buffer, filename } = await this.orders.receiptPdf(id, { id: user.id, role: user.role });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  /** Envía el recibo por correo (al dueño o a un destinatario indicado). */
  @Post(':id/receipt/email')
  @UseGuards(JwtAuthGuard)
  emailReceipt(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body('to') to?: string) {
    return this.orders.emailReceipt(id, { id: user.id, role: user.role }, to);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.orders.findOne(id);
  }
}
