import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGateway } from './admin.gateway';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminGateway],
  exports: [AdminGateway],
})
export class AdminModule {}
