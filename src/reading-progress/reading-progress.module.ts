import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingProgress } from './entities/reading-progress.entity';
import { User } from 'src/user/entities/user.entity';
import { Story } from 'src/story/entities/story.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { ReadingProgressController } from './reading-progress.controller';
import { ReadingProgressService } from './reading-progress.service';
import { ChapterModule } from 'src/chapter/chapter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadingProgress, User, Story, Chapter]),
    ChapterModule,
  ],
  controllers: [ReadingProgressController],
  providers: [ReadingProgressService],
})
export class ReadingProgressModule {}
