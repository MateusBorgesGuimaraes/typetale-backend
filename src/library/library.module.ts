import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryEntry } from './entities/library-entry.entity';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { User } from '../user/entities/user.entity';
import { Story } from '../story/entities/story.entity';
import { ReadingProgress } from '../reading-progress/entities/reading-progress.entity';
import { ChapterModule } from 'src/chapter/chapter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LibraryEntry, User, Story, ReadingProgress]),
    ChapterModule,
  ],
  providers: [LibraryService],
  controllers: [LibraryController],
})
export class LibraryModule {}
