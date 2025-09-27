import { IsString, IsOptional } from 'class-validator';

export class UpdateHighlightDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  isActive?: boolean;
}
