import { forwardRef, Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { UploadModule } from 'src/upload/upload.module';
import { ChapterModule } from 'src/chapter/chapter.module';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { VolumeModule } from 'src/volume/volume.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, User, Chapter]),
    UploadModule,
    forwardRef(() => VolumeModule),
    forwardRef(() => ChapterModule),
  ],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
