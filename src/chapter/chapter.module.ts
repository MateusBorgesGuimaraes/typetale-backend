import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Volume } from 'src/volume/entities/volume.entity';
import { User } from 'src/user/entities/user.entity';
import { Story } from 'src/story/entities/story.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Volume, User, Story])],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}
