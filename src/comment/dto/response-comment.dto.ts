import { Rating } from 'src/rating/entities/rating-entity';
import { Comment, CommentTarget } from '../entities/comment-entity';

export class ResponseCommentDto {
  readonly id: string;
  readonly body: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  rating?: Rating;

  constructor(comment: Comment, targetType: CommentTarget) {
    this.id = comment.id;
    this.body = comment.body;
    this.targetType = comment.targetType;
    this.targetId = comment.targetId;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;

    if (comment.user) {
      this.user = {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      };
    }
    if (targetType === CommentTarget.STORY && (comment as any).rating) {
      this.rating = (comment as any).rating;
    }
  }
}
