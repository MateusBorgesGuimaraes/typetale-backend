import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import {
  StoryType,
  StoryGenre,
  StoryLanguage,
  StoryStatus,
} from '../entities/story.entity';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  coverUrl: string;

  @IsEnum(StoryType)
  @IsNotEmpty()
  storyType: StoryType;

  @IsEnum(StoryGenre)
  @IsNotEmpty()
  mainGenre: StoryGenre;

  @IsEnum(StoryLanguage)
  @IsNotEmpty()
  language: StoryLanguage;

  @IsString()
  @IsNotEmpty()
  synopsis: string;

  @IsEnum(StoryStatus)
  @IsOptional()
  status?: StoryStatus;

  @IsArray()
  tags: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  chaptersCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  publishedChaptersCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  followersCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  viewsCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  wordsCount?: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  ratingAvg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ratingCount?: number;
}
