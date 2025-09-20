import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { DEFAULT_PAGINATION_LIMIT } from '../constants';

export class PaginationDto {
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @Min(1)
  limit: number = DEFAULT_PAGINATION_LIMIT;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
