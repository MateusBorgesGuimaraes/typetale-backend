import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdateReadingProgressDto {
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
