import { ResponseUserDto } from './../user/dto/response-user.dto';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Story, StoryStatus, StoryType } from './entities/story.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';
import { StoryFilterDto } from './dto/story-filter.dto';
import { UploadService } from 'src/upload/upload.service';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { ResponseStoryRankDto } from './dto/response-story-rank';
import { ChapterService } from 'src/chapter/chapter.service';
import { ResponseRecentlyUpdatedStoryDto } from './dto/response-story-recently-updated.dto';
import { error } from 'console';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepository: Repository<Story>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @Inject(forwardRef(() => ChapterService))
    private readonly chapterService: ChapterService,
    private readonly uploadService: UploadService,
  ) {}

  async create(id: string, createStoryDto: CreateStoryDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      await this.uploadService.deleteImageFromUrl(createStoryDto.coverUrl);
      throw new NotFoundException('User not found');
    }

    const newStory = this.storyRepository.create({
      ...createStoryDto,
      slug: createSlug(createStoryDto.title),
      author: user,
    });

    try {
      const createdStory = await this.storyRepository.manager.transaction(
        async (manager) => {
          return await manager.save(Story, newStory);
        },
      );

      return createdStory;
    } catch (error) {
      await this.uploadService.deleteImageFromUrl(createStoryDto.coverUrl);
      throw error;
    }
  }

  async findOne(identifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const whereCondition = isUuid ? { id: identifier } : { slug: identifier };

    const story = await this.storyRepository.findOne({
      where: whereCondition,
      relations: { author: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    await this.incrementViewsCount(story);

    return story;
  }

  async findAllUserStories(authorId: string) {
    const stories = await this.storyRepository.find({
      where: { author: { id: authorId } },
      relations: ['author'],
    });

    if (stories.length === 0 || !stories) {
      throw new NotFoundException('Stories not found');
    }

    return {
      stories,
      author: new ResponseUserDto(stories[0].author),
    };
  }

  async findWithFilters(filterDto: StoryFilterDto) {
    const queryBuilder = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author');

    this.applyFilters(queryBuilder, filterDto);

    this.applySorting(queryBuilder, filterDto.sortBy, filterDto.sortOrder);

    const page = Math.max(1, filterDto.page || 1);
    const limit = filterDto.limit || 10;
    const offset = (page - 1) * limit;
    const [data, total] = await queryBuilder
      .skip(offset)
      .take(filterDto.limit)
      .getManyAndCount();

    if (data.length === 0 || !data) {
      throw new NotFoundException('Stories not found');
    }

    return {
      data,
      meta: {
        total,
        page: page,
        limit: limit,
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
      relations: { author: true },
    });

    if (!story) throw new NotFoundException('Story not found');

    if (authorId !== story.author.id)
      throw new ForbiddenException('You are not allowed to update this story');

    const oldCoverUrl = story.coverUrl;

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

    if (Object.keys(updatedData).length === 0) return story;

    await this.storyRepository.manager.transaction(async (manager) => {
      await manager.update(Story, id, updatedData);
    });

    if (updateStoryDto.coverUrl && updateStoryDto.coverUrl !== oldCoverUrl) {
      try {
        await this.uploadService.deleteImageFromUrl(oldCoverUrl);
      } catch (err) {
        console.error('⚠️ Failed to delete image:', err.message);
      }
    }

    const updatedStory = await this.storyRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    return updatedStory!;
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

    const coverUrlToDelete = story.coverUrl;

    try {
      await this.storyRepository.manager.transaction(async (manager) => {
        await manager.delete(Story, { id });
      });

      if (coverUrlToDelete) {
        try {
          await this.uploadService.deleteImageFromUrl(coverUrlToDelete);
        } catch (err) {
          console.error('⚠️ Failed to delete image:', err.message);
        }
      }
      return { message: 'Story deleted successfully' };
    } catch (error) {
      throw error;
    }
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

  async getTopStoriesByType(storyType: StoryType) {
    const statuses = [StoryStatus.ONGOING, StoryStatus.COMPLETED];
    const base = await this.storyRepository.find({
      where: { storyType },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    const categorized = await Promise.all(
      statuses.map(async (status) =>
        this.storyRepository.find({
          where: { storyType, status },
          order: { viewsCount: 'DESC' },
          take: 5,
          relations: ['author'],
        }),
      ),
    );

    const [ongoing, completed] = categorized;

    return {
      topViewed: base.map((s) => new ResponseStoryRankDto(s)),
      topOngoing: ongoing.map((s) => new ResponseStoryRankDto(s)),
      topCompleted: completed.map((s) => new ResponseStoryRankDto(s)),
    };
  }

  async getRandomStories() {
    const stories = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author')
      .orderBy('RANDOM()')
      .take(12)
      .getMany();

    return {
      randomStories: stories.map((story) => {
        return new ResponseStoryRankDto(story);
      }),
    };
  }

  async getRecommendations(storyId: string) {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    let recommendationsQuery = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author')
      .where('story.id != :storyId', { storyId })
      .andWhere('story.storyType = :storyType', { storyType: story.storyType });

    if (story.tags && story.tags.length > 0) {
      const tagConditions = story.tags.map((tag, index) => {
        return `story.tags LIKE :tag${index}`;
      });

      const tagParams = story.tags.reduce((acc, tag, index) => {
        acc[`tag${index}`] = `%"${tag}"%`;
        return acc;
      }, {});

      recommendationsQuery = recommendationsQuery.andWhere(
        `(story.mainGenre = :mainGenre OR ${tagConditions.join(' OR ')})`,
        { mainGenre: story.mainGenre, ...tagParams },
      );
    } else {
      recommendationsQuery = recommendationsQuery.andWhere(
        'story.mainGenre = :mainGenre',
        { mainGenre: story.mainGenre },
      );
    }

    const recommendations = await recommendationsQuery
      .orderBy('RANDOM()')
      .take(8)
      .getMany();

    if (recommendations.length < 8) {
      const additionalStories = await this.storyRepository
        .createQueryBuilder('story')
        .leftJoinAndSelect('story.author', 'author')
        .where('story.id != :storyId', { storyId })
        .andWhere('story.storyType = :storyType', {
          storyType: story.storyType,
        })
        .andWhere('story.id NOT IN (:...excludeIds)', {
          excludeIds: recommendations.map((s) => s.id).concat(storyId),
        })
        .orderBy('story.viewsCount', 'DESC')
        .take(8 - recommendations.length)
        .getMany();

      recommendations.push(...additionalStories);
    }

    return {
      recommendations: recommendations.map((story) => {
        return new ResponseStoryRankDto(story);
      }),
    };
  }

  async getRecentlyUpdatedStories() {
    const stories = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author')
      .leftJoinAndSelect('story.volumes', 'volume')
      .leftJoinAndSelect('volume.chapters', 'chapter')
      .where('chapter.isDraft = :isDraft', { isDraft: false })
      .andWhere('chapter.publishedAt IS NOT NULL')
      .orderBy('chapter.publishedAt', 'DESC')
      .take(6)
      .getMany();

    const uniqueStories = Array.from(
      new Map(stories.map((story) => [story.id, story])).values(),
    ).slice(0, 6);

    return uniqueStories.map(
      (story) => new ResponseRecentlyUpdatedStoryDto(story),
    );
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
    await this.storyRepository.increment({ id: story.id }, 'viewsCount', 1);
  }
}
