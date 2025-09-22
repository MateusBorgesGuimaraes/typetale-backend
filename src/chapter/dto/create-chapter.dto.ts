import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChapterDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(255, { message: 'Title must be at most 255 characters long' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsOptional()
  @IsBoolean({ message: 'isDraft must be a boolean value' })
  isDraft?: boolean = false;

  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Position must be a valid number' },
  )
  @Min(0, { message: 'Position must be greater than or equal to 0' })
  position: number;
}
