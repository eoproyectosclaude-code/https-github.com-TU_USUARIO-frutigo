import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ProductCategory, SaleUnit } from '@frutigo/shared';

const CATEGORIES = ['FRUTAS', 'VERDURAS', 'LEGUMBRES', 'TUBERCULOS', 'HIERBAS'];
const UNITS = ['KG', 'HALF_QUINTAL', 'QUINTAL'];

export class PriceDto {
  @IsEnum(UNITS as unknown as object) unit!: SaleUnit;
  @IsNumber() @Min(0.01) priceUsd!: number;
  @IsNumber() @Min(0) stock!: number;
}

export class CreateProductDto {
  @IsString() slug!: string;
  @IsString() nameEs!: string;
  @IsString() nameEn!: string;
  @IsEnum(CATEGORIES as unknown as object) category!: ProductCategory;
  @IsString() descriptionEs!: string;
  @IsString() descriptionEn!: string;
  @IsString() imageUrl!: string;
  @IsString() province!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @IsOptional() @IsBoolean() shipProvisioning?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceDto)
  prices!: PriceDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() nameEs?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() descriptionEs?: string;
  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() shipProvisioning?: boolean;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceDto)
  prices?: PriceDto[];
}
