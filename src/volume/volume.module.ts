import { Module } from '@nestjs/common';
import { VolumeService } from './volume.service';
import { VolumeController } from './volume.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Volume } from './entities/volume.entity';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Volume, Story, User])],
  controllers: [VolumeController],
  providers: [VolumeService],
})
export class VolumeModule {}
