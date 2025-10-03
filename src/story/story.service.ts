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
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';
import { StoryFilterDto } from './dto/story-filter.dto';

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

    await this.incrementViewsCount(story);

    return story;
  }

  async findOneById(id: string) {
    const story = await this.storyRepository.findOneBy({ id });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    await this.incrementViewsCount(story);

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

  async findWithFilters(filterDto: StoryFilterDto) {
    const queryBuilder = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author');

    this.applyFilters(queryBuilder, filterDto);

    this.applySorting(queryBuilder, filterDto.sortBy, filterDto.sortOrder);

    const offset = (filterDto.page - 1) * filterDto.limit;
    const [data, total] = await queryBuilder
      .skip(offset)
      .take(filterDto.limit)
      .getManyAndCount();

    if (!data) {
      throw new NotFoundException('Stories not found');
    }

    return {
      data,
      meta: {
        total,
        page: filterDto.page,
        limit: filterDto.limit,
        totalPages: Math.ceil(total / filterDto.limit),
        hasNextPage: filterDto.page < Math.ceil(total / filterDto.limit),
        hasPreviousPage: filterDto.page > 1,
      },
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

    const potentialUpdates = {
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

    const updatedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(potentialUpdates)) {
      if (value !== undefined && (story as any)[key] !== value) {
        updatedData[key] = value;
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

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Story>,
    filters: StoryFilterDto,
  ): void {
    const {
      title,
      slug,
      storyType,
      mainGenre,
      language,
      status,
      tags,
      chaptersCount,
      followersCount,
      viewsCount,
      ratingAvg,
      search,
    } = filters;

    if (search) {
      queryBuilder.andWhere(
        '(story.title ILIKE :search OR story.synopsis ILIKE :search OR author.username ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (title) {
      queryBuilder.andWhere('story.title ILIKE :title', {
        title: `%${title}%`,
      });
    }

    if (slug) {
      queryBuilder.andWhere('story.slug = :slug', { slug });
    }

    if (storyType) {
      queryBuilder.andWhere('story.storyType = :storyType', { storyType });
    }

    if (mainGenre) {
      queryBuilder.andWhere('story.mainGenre = :mainGenre', { mainGenre });
    }

    if (language) {
      queryBuilder.andWhere('story.language = :language', { language });
    }

    if (status) {
      queryBuilder.andWhere('story.status = :status', { status });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('story.tags && :tags', { tags });
    }

    if (chaptersCount !== undefined) {
      queryBuilder.andWhere('story.chaptersCount >= :chaptersCount', {
        chaptersCount,
      });
    }

    if (followersCount !== undefined) {
      queryBuilder.andWhere('story.followersCount >= :followersCount', {
        followersCount,
      });
    }

    if (viewsCount !== undefined) {
      queryBuilder.andWhere('story.viewsCount >= :viewsCount', { viewsCount });
    }

    if (ratingAvg !== undefined) {
      queryBuilder.andWhere('story.ratingAvg >= :ratingAvg', { ratingAvg });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Story>,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): void {
    const allowedSortFields = [
      'id',
      'title',
      'createdAt',
      'updatedAt',
      'chaptersCount',
      'followersCount',
      'viewsCount',
      'ratingAvg',
      'ratingCount',
    ];

    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`story.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('story.createdAt', 'DESC');
    }

    queryBuilder.addOrderBy('story.id', 'ASC');
  }

  async incrementChaptersCount(story: Story): Promise<void> {
    story.chaptersCount += 1;
    await this.storyRepository.save(story);
  }

  async decrementChaptersCount(story: Story): Promise<void> {
    story.chaptersCount -= 1;
    await this.storyRepository.save(story);
  }

  async incrementPublishedChaptersCount(story: Story): Promise<void> {
    story.publishedChaptersCount += 1;
    await this.storyRepository.save(story);
  }

  async changeWordsCount(story: Story, wordsCount: number): Promise<void> {
    story.wordsCount = wordsCount;
    await this.storyRepository.save(story);
  }

  async decrementPublishedChaptersCount(story: Story): Promise<void> {
    story.publishedChaptersCount -= 1;
    await this.storyRepository.save(story);
  }

  async incrementFollowersCount(story: Story): Promise<void> {
    story.followersCount += 1;
    await this.storyRepository.save(story);
  }

  async decrementFollowersCount(story: Story): Promise<void> {
    story.followersCount -= 1;
    await this.storyRepository.save(story);
  }

  async decrementFollowersCountById(id: string): Promise<void> {
    const story = await this.storyRepository.findOneBy({ id });
    if (story) {
      story.followersCount -= 1;
      await this.storyRepository.save(story);
    }
  }

  async incrementViewsCount(story: Story): Promise<void> {
    story.viewsCount += 1;
    await this.storyRepository.save(story);
  }
}
