import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { Rating } from './entities/rating-entity';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Story, User])],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule {}
