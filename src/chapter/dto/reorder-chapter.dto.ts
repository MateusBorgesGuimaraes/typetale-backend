import { IsOptional, IsString } from 'class-validator';

export class ReorderChapterDto {
  @IsOptional()
  @IsString()
  beforeChapterId?: string;

  @IsOptional()
  @IsString()
  afterChapterId?: string;
}
