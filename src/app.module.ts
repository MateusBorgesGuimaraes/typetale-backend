import { ReadingProgressModule } from './reading-progress/reading-progress.module';
import { LibraryModule } from './library/library.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryModule } from './story/story.module';
import { VolumeModule } from './volume/volume.module';
import { ChapterModule } from './chapter/chapter.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { HighlightModule } from './highlight/highlight.module';
import { CommentModule } from './comment/comment.module';
import { RatingModule } from './rating/rating.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_DATABASE || './db.sqlite',
      synchronize: process.env.DB_SYNCHRONIZE === '1',
      autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES === '1',
    }),
    StoryModule,
    VolumeModule,
    ChapterModule,
    AnnouncementModule,
    HighlightModule,
    ReadingProgressModule,
    LibraryModule,
    CommentModule,
    RatingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
