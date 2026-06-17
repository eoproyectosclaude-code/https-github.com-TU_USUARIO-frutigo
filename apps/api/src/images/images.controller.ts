import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  /** Busca imágenes en Google para asignar a un producto. */
  @Get('search')
  search(@Query('q') q: string) {
    return this.images.search(q ?? '');
  }
}
