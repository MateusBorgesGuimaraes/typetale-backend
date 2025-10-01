import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment-entity';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { Announcement } from 'src/announcement/entities/announcement.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { Rating } from 'src/rating/entities/rating-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Story,
      User,
      Announcement,
      Chapter,
      Rating,
    ]),
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
