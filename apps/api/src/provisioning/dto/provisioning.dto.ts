import { IsArray, IsEnum, IsISO8601, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Port, SaleUnit } from '@frutigo/shared';

const PORTS = ['BALBOA', 'CRISTOBAL', 'COLON'];
const UNITS = ['KG', 'HALF_QUINTAL', 'QUINTAL'];

export class CreateVesselDto {
  @IsString() name!: string;
  @IsString() imo!: string;
  @IsString() flag!: string;
  @IsString() agent!: string;
}

export class ProvisioningLineDto {
  @IsString() productId!: string;
  @IsEnum(UNITS as unknown as object) unit!: SaleUnit;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateProvisioningDto {
  @IsString() vesselId!: string;
  @IsEnum(PORTS as unknown as object) port!: Port;
  @IsISO8601() windowStart!: string;
  @IsISO8601() windowEnd!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisioningLineDto)
  lines!: ProvisioningLineDto[];
}
