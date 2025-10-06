import { ResponseUserDto } from './../user/dto/response-user.dto';
import {
  ForbiddenException,
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

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story) private storyRepository: Repository<Story>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly uploadService: UploadService,
  ) {}

  async create(id: string, createStoryDto: CreateStoryDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      await this.uploadService.deleteImageFromUrl(createStoryDto.coverUrl);
      throw new NotFoundException('User not found');
    }

    const post = this.storyRepository.create({
      ...createStoryDto,
      slug: createSlug(createStoryDto.title),
      author: user,
    });

    try {
      return this.storyRepository.save(post);
    } catch (error) {
      await this.uploadService.deleteImageFromUrl(createStoryDto.coverUrl);
      throw error;
    }
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

    if (updateStoryDto.coverUrl !== story.coverUrl) {
      await this.uploadService.deleteImageFromUrl(story.coverUrl);
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

    await this.uploadService.deleteImageFromUrl(story.coverUrl);

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

  async getTopFanfics() {
    const topViewed = await this.storyRepository.find({
      where: { storyType: StoryType.FANFIC },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    const topOngoing = await this.storyRepository.find({
      where: {
        storyType: StoryType.FANFIC,
        status: StoryStatus.ONGOING,
      },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    const topCompleted = await this.storyRepository.find({
      where: {
        storyType: StoryType.FANFIC,
        status: StoryStatus.COMPLETED,
      },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    return {
      topViewed,
      topOngoing,
      topCompleted,
    };
  }

  async getTopOriginals() {
    const topViewed = await this.storyRepository.find({
      where: { storyType: StoryType.ORIGINAL },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    const topOngoing = await this.storyRepository.find({
      where: {
        storyType: StoryType.ORIGINAL,
        status: StoryStatus.ONGOING,
      },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    const topCompleted = await this.storyRepository.find({
      where: {
        storyType: StoryType.ORIGINAL,
        status: StoryStatus.COMPLETED,
      },
      order: { viewsCount: 'DESC' },
      take: 5,
      relations: ['author'],
    });

    return {
      topViewed,
      topOngoing,
      topCompleted,
    };
  }

  async getRandomStories() {
    const stories = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author')
      .orderBy('RANDOM()')
      .take(12)
      .getMany();

    return stories;
  }

  async getRecentlyUpdated() {
    const recentStoryIds = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoin('story.volumes', 'volume')
      .leftJoin('volume.chapters', 'chapter')
      .where('chapter.isDraft = :isDraft', { isDraft: false })
      .andWhere('chapter.publishedAt IS NOT NULL')
      .orderBy('chapter.updatedAt', 'DESC')
      .select('DISTINCT story.id', 'id')
      .limit(7)
      .getRawMany();

    if (recentStoryIds.length === 0) {
      throw new NotFoundException('Stories not found');
    }

    const ids = recentStoryIds.map((item) => item.id);

    const stories = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.author', 'author')
      .leftJoinAndSelect('story.volumes', 'volume')
      .leftJoinAndSelect('volume.chapters', 'chapter')
      .where('story.id IN (:...ids)', { ids })
      .andWhere('chapter.isDraft = :isDraft', { isDraft: false })
      .andWhere('chapter.publishedAt IS NOT NULL')
      .getMany();

    const storiesMap = new Map();

    for (const story of stories) {
      if (!storiesMap.has(story.id)) {
        const latestChapter = story.volumes
          .flatMap((volume) => volume.chapters)
          .filter((chapter) => !chapter.isDraft && chapter.publishedAt)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

        if (latestChapter) {
          storiesMap.set(story.id, {
            story: {
              id: story.id,
              title: story.title,
              slug: story.slug,
              coverUrl: story.coverUrl,
              storyType: story.storyType,
              mainGenre: story.mainGenre,
              author: {
                id: story.author.id,
                username: story.author.username,
              },
            },
            latestChapter: {
              id: latestChapter.id,
              title: latestChapter.title,
              slug: latestChapter.slug,
              updatedAt: latestChapter.updatedAt,
              publishedAt: latestChapter.publishedAt,
            },
          });
        }
      }
    }

    return Array.from(storiesMap.values());
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

    return recommendations;
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
