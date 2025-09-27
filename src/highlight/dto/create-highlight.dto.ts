import { IsString, IsNotEmpty } from 'class-validator';

export class CreateHighlightDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  banner: string;

  @IsString()
  @IsNotEmpty()
  link: string;
}
