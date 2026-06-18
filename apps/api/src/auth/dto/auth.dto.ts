import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { CustomerSegment } from '@frutigo/shared';

const SEGMENTS = ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'];

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(SEGMENTS as unknown as object)
  segment?: CustomerSegment;

  /** Código de referido de quien lo invitó (opcional). */
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
