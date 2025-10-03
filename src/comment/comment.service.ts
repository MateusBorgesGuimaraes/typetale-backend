import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from 'src/announcement/entities/announcement.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { Story } from 'src/story/entities/story.entity';
import { Comment, CommentTarget } from './entities/comment-entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ResponseCommentDto } from './dto/response-comment.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateRatingDto } from 'src/rating/dto/create-rating.dto';
import { Rating } from 'src/rating/entities/rating-entity';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RatingService } from 'src/rating/rating.service';
import { ResponseCommentWithRatingDto } from './dto/response-comment-with-rating.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly ratingService: RatingService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    req: AuthenticatedRequest,
    createCommentDto: CreateCommentDto & { rating?: CreateRatingDto },
  ) {
    const user = await this.userRepository.findOneBy({ id: req.user.id });
    if (!user) throw new NotFoundException('User not found');

    const { targetType, targetId, rating } = createCommentDto;

    switch (targetType) {
      case CommentTarget.STORY: {
        if (!rating) {
          throw new BadRequestException(
            'Rating is required when commenting on a story',
          );
        }

        const story = await this.storyRepository.findOneBy({ id: targetId });
        if (!story)
          throw new NotFoundException(`Story with id ${targetId} not found`);

        return this.dataSource.transaction(async (manager) => {
          const ratingEntity = await this.ratingService.rateStory(
            targetId,
            user.id,
            rating,
            manager,
          );

          const comment = manager.create(Comment, {
            body: createCommentDto.body,
            targetType: createCommentDto.targetType,
            targetId: createCommentDto.targetId,
            user,
            rating: ratingEntity,
          });
          const savedComment = await manager.save(comment);

          (savedComment as any).rating = ratingEntity;

          return new ResponseCommentDto(savedComment, CommentTarget.STORY);
        });
      }

      case CommentTarget.CHAPTER: {
        const chapter = await this.chapterRepository.findOneBy({
          id: targetId,
        });

        if (!chapter)
          throw new NotFoundException(`Chapter with id ${targetId} not found`);

        const comment = this.commentRepository.create({
          body: createCommentDto.body,
          targetType: createCommentDto.targetType,
          targetId: createCommentDto.targetId,
          user,
        });
        const savedComment = await this.commentRepository.save(comment);
        return new ResponseCommentDto(savedComment);
      }

      case CommentTarget.ANNOUCEMENT: {
        const announcement = await this.announcementRepository.findOneBy({
          id: targetId,
        });
        if (!announcement)
          throw new NotFoundException(
            `Announcement with id ${targetId} not found`,
          );

        const comment = this.commentRepository.create({
          body: createCommentDto.body,
          targetType: createCommentDto.targetType,
          targetId: createCommentDto.targetId,
          user,
        });
        const savedComment = await this.commentRepository.save(comment);
        return new ResponseCommentDto(savedComment);
      }

      default:
        throw new BadRequestException('Invalid target type');
    }
  }

  async findByTarget(
    targetType: CommentTarget,
    targetId: string,
    pagination: PaginationDto,
  ): Promise<{
    data: ResponseCommentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;

    const relations = ['user'];
    if (targetType === CommentTarget.STORY) {
      relations.push('rating');
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { targetType, targetId },
      relations,
      order: { [pagination.sortBy]: pagination.sortOrder || 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (comments.length === 0) {
      throw new NotFoundException(`No comments found for ${targetType}`);
    }

    return {
      data: comments.map((c) => new ResponseCommentDto(c, targetType)),
      total,
      page,
      limit,
    };
  }

  async updateComment(
    commentId: string,
    user: User,
    updateDto: UpdateCommentDto,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== user.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    Object.assign(comment, updateDto);
    console.log('comment', comment);
    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, user: User) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}
