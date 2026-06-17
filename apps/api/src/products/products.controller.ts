import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query('category') category?: string) {
    return this.products.findAll(category);
  }

  /** Recomendaciones inteligentes para el inicio. */
  @Get('recommended')
  recommended(@Query('segment') segment?: string) {
    return this.products.recommended(segment);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const product = await this.products.findOne(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
