import { ResponseCommentDto } from './response-comment.dto';
import { ResponseRatingDto } from 'src/rating/dto/response-rating.dto';
import { Comment } from '../entities/comment-entity';
import { Rating } from 'src/rating/entities/rating-entity';

export class ResponseCommentWithRatingDto {
  readonly comment: ResponseCommentDto;
  readonly rating: ResponseRatingDto;

  constructor(comment: Comment, rating: Rating) {
    this.comment = new ResponseCommentDto(comment);
    this.rating = new ResponseRatingDto(rating);
  }
}
