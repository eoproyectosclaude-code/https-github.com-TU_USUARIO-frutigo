import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateProductDto, UpdateProductDto } from './dto/supplier-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

/** Portal de proveedor — todas las rutas exigen rol PROVEEDOR. */
@Controller('suppliers/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROVEEDOR')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.suppliers.dashboard(user.supplierId);
  }

  @Get('products')
  products(@CurrentUser() user: AuthUser) {
    return this.suppliers.listProducts(user.supplierId);
  }

  @Post('products')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.suppliers.createProduct(user.supplierId, dto);
  }

  @Patch('products/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.suppliers.updateProduct(user.supplierId, id, dto);
  }

  @Get('orders')
  orders(@CurrentUser() user: AuthUser) {
    return this.suppliers.listOrders(user.supplierId);
  }

  @Get('forecast')
  forecast(@CurrentUser() user: AuthUser) {
    return this.suppliers.forecast(user.supplierId);
  }
}
