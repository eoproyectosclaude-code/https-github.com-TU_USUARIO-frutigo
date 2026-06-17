import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import type { PaymentMethod, CryptoAsset } from '@frutigo/shared';

const METHODS = ['STRIPE', 'YAPPY', 'VISA', 'CRYPTO', 'ACH_SWIFT', 'CASH'];
const ASSETS = ['BTC', 'USDT', 'USDC'];

export class CreateIntentDto {
  @IsString()
  orderId!: string;

  @IsEnum(METHODS as unknown as object)
  method!: PaymentMethod;

  @IsOptional()
  @IsEnum(ASSETS as unknown as object)
  cryptoAsset?: CryptoAsset;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
