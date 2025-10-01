import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating-entity';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Story) private storyRepository: Repository<Story>,
  ) {}

  async rateStory(
    storyId: string,
    userId: string,
    createRaingDto: CreateRatingDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) throw new NotFoundException('Story not found');

    const rating = this.ratingRepository.create({
      ...createRaingDto,
      user,
      story,
    });

    return this.ratingRepository.save(rating);
  }
}
