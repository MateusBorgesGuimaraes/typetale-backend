import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Volume } from 'src/volume/entities/volume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Volume])],
  controllers: [ChapterController],
  providers: [ChapterService],
})
export class ChapterModule {}
