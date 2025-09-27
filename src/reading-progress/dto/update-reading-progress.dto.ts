import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdateReadingProgressDto {
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @IsString()
  @IsNotEmpty()
  chapterId: string;

  // Se true, força a atualização mesmo se não for sequencial
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
