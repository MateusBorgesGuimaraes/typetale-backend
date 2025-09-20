import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  StoryGenre,
  StoryLanguage,
  StoryStatus,
  StoryType,
} from '../entities/story.entity';
import { Transform, Type } from 'class-transformer';
export class StoryFilterDto extends PaginationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug?: string;

  @IsEnum(StoryType)
  @IsOptional()
  storyType?: StoryType;

  @IsEnum(StoryGenre)
  @IsOptional()
  mainGenre?: StoryGenre;

  @IsEnum(StoryLanguage)
  @IsOptional()
  language?: StoryLanguage;

  @IsEnum(StoryStatus)
  @IsOptional()
  status?: StoryStatus;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
        .map((tag) => tag?.toString().trim().toLowerCase())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
    }
    return value;
  })
  tags?: string[];

  @Type(() => Number)
  @IsNumber({}, { message: 'chaptersCount should be a number' })
  @Min(0, { message: 'chaptersCount cannot be negative' })
  @IsOptional()
  chaptersCount?: number;

  @IsNumber({}, { message: 'followersCount should be a number' })
  @Min(0, { message: 'followersCount cannot be negative' })
  @IsOptional()
  followersCount?: number;

  @IsNumber({}, { message: 'viewsCount should be a number' })
  @Min(0, { message: 'viewsCount cannot be negative' })
  @IsOptional()
  viewsCount?: number;

  @IsNumber({}, { message: 'ratingAvg should be a number' })
  @Min(0, { message: 'ratingAvg cannot be negative' })
  @IsOptional()
  ratingAvg?: number;
}
