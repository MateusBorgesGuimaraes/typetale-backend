import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepository: Repository<Story>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(id: string, createStoryDto: CreateStoryDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = this.storyRepository.create({
      ...createStoryDto,
      author: user,
    });

    return this.storyRepository.save(post);
  }

  async findOneBySlug(slug: string) {
    const story = await this.storyRepository.findOne({
      where: { slug },
      relations: {
        author: true,
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    return story;
  }
}
