import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

class RegisterTokenDto {
  @IsString() token!: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('token')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterTokenDto) {
    return this.notifications.registerToken(user.id, dto.token);
  }
}
