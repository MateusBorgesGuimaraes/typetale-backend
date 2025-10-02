import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
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
    createRatingDto: CreateRatingDto,
    manager?: EntityManager,
  ) {
    const ratingRepo = manager
      ? manager.getRepository(Rating)
      : this.ratingRepository;
    const userRepo = manager
      ? manager.getRepository(User)
      : this.userRepository;
    const storyRepo = manager
      ? manager.getRepository(Story)
      : this.storyRepository;

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const story = await storyRepo.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');
    const existingRating = await ratingRepo.findOne({
      where: {
        user: { id: userId },
        story: { id: storyId },
      },
    });

    if (existingRating) {
      throw new ConflictException(
        'You have already rated this story. Use update endpoint to modify your rating.',
      );
    }

    const rating = ratingRepo.create({
      ...createRatingDto,
      user,
      story,
    });

    return ratingRepo.save(rating);
  }

  async updateRating(
    storyId: string,
    userId: string,
    updateRatingDto: CreateRatingDto,
  ) {
    const rating = await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        story: { id: storyId },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    Object.assign(rating, updateRatingDto);
    return this.ratingRepository.save(rating);
  }

  async getUserRating(storyId: string, userId: string) {
    const rating = await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        story: { id: storyId },
      },
      relations: ['user', 'story'],
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async deleteRating(storyId: string, userId: string) {
    const rating = await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        story: { id: storyId },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    await this.ratingRepository.remove(rating);
    return { message: 'Rating deleted successfully' };
  }
}
