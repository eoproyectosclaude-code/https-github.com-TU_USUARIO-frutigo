import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ProvisioningService } from './provisioning.service';
import { CreateProvisioningDto, CreateVesselDto } from './dto/provisioning.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

/** Ship Provisioning — requiere sesión (naviera / agente marítimo). */
@Controller('provisioning')
@UseGuards(JwtAuthGuard)
export class ProvisioningController {
  constructor(private readonly provisioning: ProvisioningService) {}

  @Post('vessels')
  createVessel(@CurrentUser() user: AuthUser, @Body() dto: CreateVesselDto) {
    return this.provisioning.createVessel(user.id, dto);
  }

  @Get('vessels')
  vessels(@CurrentUser() user: AuthUser) {
    return this.provisioning.listVessels(user.id);
  }

  @Post('requests')
  createRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateProvisioningDto) {
    return this.provisioning.createRequest(user.id, dto);
  }

  @Get('requests')
  requests(@CurrentUser() user: AuthUser) {
    return this.provisioning.listRequests(user.id);
  }

  @Get('requests/:id/manifest')
  manifest(@Param('id') id: string) {
    return this.provisioning.manifest(id);
  }

  /** Manifiesto en PDF, descargable. */
  @Get('requests/:id/manifest.pdf')
  async manifestPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.provisioning.manifestPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }
}
