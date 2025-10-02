import { Comment, CommentTarget } from '../entities/comment-entity';
import { ResponseRatingDto } from 'src/rating/dto/response-rating.dto';

export class ResponseCommentDto {
  readonly id: string;
  readonly body: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  readonly rating?: ResponseRatingDto;

  constructor(comment: Comment, targetType?: CommentTarget) {
    this.id = comment.id;
    this.body = comment.body;
    this.targetType = comment.targetType;
    this.targetId = comment.targetId;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.user = {
      id: comment.user.id,
      username: comment.user.username,
      avatarUrl: comment.user.avatarUrl,
    };

    if (targetType === CommentTarget.STORY && (comment as any).rating) {
      this.rating = new ResponseRatingDto((comment as any).rating);
    }
  }
}
