import { CreateCommentDto } from './create-comment.dto';
import { CreateRatingDto } from 'src/rating/dto/create-rating.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreateCommentAndRatingDto {
  @ValidateNested()
  @Type(() => CreateCommentDto)
  comment: CreateCommentDto;

  @ValidateNested()
  @Type(() => CreateRatingDto)
  rating: CreateRatingDto;
}
