import { ResponseUserDto } from './../user/dto/response-user.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';

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
      slug: createSlug(createStoryDto.title),
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

  async findOneById(id: string) {
    const story = await this.storyRepository.findOneBy({ id });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    return story;
  }

  async findAllUserStories(authorId: string) {
    const author = await this.userRepository.findOneBy({ id: authorId });
    if (!author) {
      throw new NotFoundException('User not found');
    }

    const stories = await this.storyRepository.find({
      where: { author: { id: authorId } },
    });

    if (!stories) {
      throw new NotFoundException('Stories not found');
    }

    return {
      stories,
      author: new ResponseUserDto(author),
    };
  }

  async updateById(
    id: string,
    updateStoryDto: UpdateStoryDto,
    authorId: string,
  ) {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: {
        author: true,
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (authorId !== story.author.id) {
      throw new ForbiddenException('You are not allowed to update this story');
    }

    const potentialUpdates: Partial<typeof story> = {
      title: updateStoryDto.title,
      slug:
        updateStoryDto.title && updateStoryDto.title !== story.title
          ? createSlug(updateStoryDto.title)
          : undefined,
      coverUrl: updateStoryDto.coverUrl,
      synopsis: updateStoryDto.synopsis,
      mainGenre: updateStoryDto.mainGenre,
      language: updateStoryDto.language,
      status: updateStoryDto.status,
      tags: updateStoryDto.tags,
    };

    const updatedData: Partial<typeof story> = {};
    for (const [key, value] of Object.entries(potentialUpdates)) {
      if (value !== undefined && (story as any)[key] !== value) {
        (updatedData as any)[key] = value;
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return story;
    }

    await this.storyRepository.update(id, updatedData);

    const updatedStory = await this.storyRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!updatedStory) {
      throw new NotFoundException('Story not found');
    }

    return updatedStory;
  }

  async deleteById(id: string, authorId: string) {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (authorId !== story.author.id) {
      throw new ForbiddenException('You are not allowed to delete this story');
    }

    await this.storyRepository.delete(id);

    return {
      message: 'Story deleted successfully',
    };
  }
}
