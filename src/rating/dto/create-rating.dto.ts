import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  writingQuality: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  updateStability: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  plotDevelopment: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  charactersBuilding: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  worldBuilding: number;
}
