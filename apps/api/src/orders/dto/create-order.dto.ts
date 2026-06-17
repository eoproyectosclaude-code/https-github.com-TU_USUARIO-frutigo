import { IsArray, IsBoolean, IsEnum, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { CustomerSegment, DeliveryType, SaleUnit } from '@frutigo/shared';

const SEGMENTS = ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'];
const UNITS = ['KG', 'HALF_QUINTAL', 'QUINTAL'];

export class OrderLineDto {
  @IsString() productId!: string;
  @IsEnum(UNITS as unknown as object) unit!: SaleUnit;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateOrderDto {
  @IsEnum(SEGMENTS as unknown as object) segment!: CustomerSegment;
  @IsString() deliveryType!: DeliveryType;
  @IsBoolean() taxExempt!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
