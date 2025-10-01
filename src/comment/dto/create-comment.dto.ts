import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { CommentTarget } from '../entities/comment-entity';

export class CreateCommentDto {
  @IsNotEmpty()
  body: string;

  @IsEnum(CommentTarget)
  @IsNotEmpty()
  targetType: CommentTarget;

  @IsNotEmpty()
  @IsUUID()
  targetId: string;
}
