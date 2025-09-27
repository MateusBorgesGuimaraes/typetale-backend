import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVolumeDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(255, { message: 'Title must be at most 255 characters long' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, {
    message: 'Description must be at most 1000 characters long',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;
}
