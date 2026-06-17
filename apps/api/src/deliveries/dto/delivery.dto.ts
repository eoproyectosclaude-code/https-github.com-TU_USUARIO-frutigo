import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import type { DeliveryStatus, DriverStatus, VehicleType } from '@frutigo/shared';

const DELIVERY_STATUS = ['ASIGNADO', 'RECOGIDO', 'EN_RUTA', 'ENTREGADO', 'FALLIDO'];
const DRIVER_STATUS = ['DISPONIBLE', 'EN_RUTA', 'INACTIVO'];
const VEHICLES = ['MOTO', 'AUTO', 'VAN', 'CAMION'];

export class RegisterDriverDto {
  @IsString() name!: string;
  @IsEnum(VEHICLES as unknown as object) vehicle!: VehicleType;
  @IsString() plate!: string;
}

export class AssignDeliveryDto {
  @IsString() orderId!: string;
  @IsString() driverId!: string;
  @IsString() pickupAddress!: string;
  @IsString() dropoffAddress!: string;
  @IsOptional() @IsLatitude() dropoffLat?: number;
  @IsOptional() @IsLongitude() dropoffLng?: number;
}

export class UpdateStatusDto {
  @IsEnum(DELIVERY_STATUS as unknown as object) status!: DeliveryStatus;
}

export class PingDto {
  @IsLatitude() lat!: number;
  @IsLongitude() lng!: number;
}

export class DriverStatusDto {
  @IsEnum(DRIVER_STATUS as unknown as object) status!: DriverStatus;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
}
