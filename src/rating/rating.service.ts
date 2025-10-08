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
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Story) private storyRepository: Repository<Story>,
  ) {}

  private calculateAverageRating(rating: Rating): number {
    const {
      writingQuality,
      updateStability,
      plotDevelopment,
      charactersBuilding,
      worldBuilding,
    } = rating;

    const total =
      writingQuality +
      updateStability +
      plotDevelopment +
      charactersBuilding +
      worldBuilding;

    return total / 5;
  }

  private async updateStoryRatingStats(
    storyId: string,
    manager?: EntityManager,
  ) {
    const ratingRepo = manager
      ? manager.getRepository(Rating)
      : this.ratingRepository;
    const storyRepo = manager
      ? manager.getRepository(Story)
      : this.storyRepository;

    const ratings = await ratingRepo.find({
      where: { story: { id: storyId } },
    });

    const ratingCount = ratings.length;
    let ratingAvg: number | undefined = undefined;

    if (ratingCount > 0) {
      const totalAvg = ratings.reduce((sum, rating) => {
        return sum + this.calculateAverageRating(rating);
      }, 0);
      ratingAvg = totalAvg / ratingCount;
    }

    await storyRepo.update(storyId, {
      ratingCount,
      ratingAvg,
    });
  }

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

    const savedRating = await ratingRepo.save(rating);

    await this.updateStoryRatingStats(storyId, manager);

    return savedRating;
  }

  async updateRating(
    storyId: string,
    userId: string,
    updateRatingDto: UpdateRatingDto,
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
    const updatedRating = await this.ratingRepository.save(rating);

    await this.updateStoryRatingStats(storyId);

    return updatedRating;
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

    await this.updateStoryRatingStats(storyId);

    return { message: 'Rating deleted successfully' };
  }
}
