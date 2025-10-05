import { Module } from '@nestjs/common';
import { HighlightService } from './highlight.service';
import { HighlightController } from './highlight.controller';
import { Highlight } from './entities/highlight.entity';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Highlight, User]), UploadModule],
  controllers: [HighlightController],
  providers: [HighlightService],
  exports: [HighlightService],
})
export class HighlightModule {}
