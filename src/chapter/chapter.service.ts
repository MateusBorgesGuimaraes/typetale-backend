import { Story } from './../story/entities/story.entity';
import { ReorderChapterDto } from './dto/reorder-chapter.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { In, Repository } from 'typeorm';
import { Volume } from 'src/volume/entities/volume.entity';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';
import { FractionalIndexingHelper } from 'src/common/utils/fractional-indexing-helper';
import { countWords } from 'src/common/utils/words-count';
import { StoryService } from 'src/story/story.service';

export interface ChapterWithNavigation {
  id: string;
  title: string;
  slug: string;
  content: string;
  isDraft: boolean;
  position: string;
  publishedAt: Date | null;
  wordsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  volume: Volume;
  visualPosition: number;
  navigation: {
    previous: {
      id: string;
      title: string;
      slug: string;
      volumeTitle: string;
    } | null;
    next: {
      id: string;
      title: string;
      slug: string;
      volumeTitle: string;
    } | null;
    totalChapters: number;
  };
}

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter) private chapterRepository: Repository<Chapter>,
    private readonly storyService: StoryService,
    @InjectRepository(Volume) private volumeRepository: Repository<Volume>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
  ) {}

  async createChapter(
    volumeId: string,
    authorId: string,
    createChapterDto: CreateChapterDto,
  ) {
    const user = await this.userRepository.findOneBy({ id: authorId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const volume = await this.volumeRepository.findOne({
      where: { id: volumeId },
      relations: ['story', 'story.author'],
    });
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }

    if (volume.story.author.id !== user.id) {
      throw new NotFoundException('You are not the author of this story');
    }

    const lastChapter = await this.chapterRepository.findOne({
      where: { volume: { id: volume.id } },
      order: { position: 'DESC' },
    });

    let nextPosition: string;
    if (!lastChapter || lastChapter.position === 'a0') {
      const existingChapters = await this.chapterRepository.find({
        where: { volume: { id: volumeId } },
        order: { createdAt: 'ASC' },
      });

      nextPosition = `a${existingChapters.length.toString(36)}`;
    } else {
      nextPosition = FractionalIndexingHelper.generateAfter(
        lastChapter.position,
      );
    }

    const wordsCount = countWords(createChapterDto.content);

    const globalPosition = await this.getNextGlobalPosition(volume.story.id);

    const chapter = this.chapterRepository.create({
      title: createChapterDto.title,
      slug: createSlug(createChapterDto.title),
      content: createChapterDto.content,
      isDraft: createChapterDto.isDraft,
      publishedAt: createChapterDto.isDraft ? null : new Date(),
      position: nextPosition,
      wordsCount,
      volume,
    });

    const savedChapter = await this.chapterRepository.save(chapter);

    if (!savedChapter.isDraft) {
      await this.volumeRepository.save({
        ...volume,
        chaptersCount: volume.chaptersCount + 1,
      });

      await this.storyService.incrementChaptersCount(volume.story);

      await this.storyService.incrementPublishedChaptersCount(volume.story);

      await this.storyService.changeWordsCount(volume.story, wordsCount);
    }

    return {
      ...savedChapter,
      visualPosition: globalPosition,
    };
  }

  async publishChapter(chapterId: string, authorId: string) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story', 'volume.story.author'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.volume.story.author.id !== authorId) {
      throw new ForbiddenException('You are not the author of this story');
    }

    if (!chapter.isDraft) {
      throw new BadRequestException('Chapter is already published');
    }

    chapter.isDraft = false;
    chapter.publishedAt = new Date();

    const savedChapter = await this.chapterRepository.save(chapter);

    await this.volumeRepository.increment(
      { id: chapter.volume.id },
      'chaptersCount',
      1,
    );

    await this.storyService.incrementChaptersCount(chapter.volume.story);
    await this.storyService.incrementPublishedChaptersCount(
      chapter.volume.story,
    );
    await this.storyService.changeWordsCount(
      chapter.volume.story,
      chapter.wordsCount,
    );

    return savedChapter;
  }

  async reorderChapter(
    chapterId: string,
    userId: string,
    reorderDto: ReorderChapterDto,
  ) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story', 'volume.story.author'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    if (chapter.volume.story.author.id !== userId) {
      throw new ForbiddenException('You are not the author of this story');
    }

    let beforePosition: string | undefined;
    let afterPosition: string | undefined;

    if (reorderDto.beforeChapterId) {
      const beforeChapter = await this.chapterRepository.findOne({
        where: {
          id: reorderDto.beforeChapterId,
          volume: { id: chapter.volume.id },
        },
      });
      if (!beforeChapter) {
        throw new NotFoundException('Before chapter not found');
      }
      beforePosition = beforeChapter.position;
    }

    if (reorderDto.afterChapterId) {
      const afterChapter = await this.chapterRepository.findOne({
        where: {
          id: reorderDto.afterChapterId,
          volume: { id: chapter.volume.id },
        },
      });
      if (!afterChapter) {
        throw new NotFoundException('After chapter not found');
      }
      afterPosition = afterChapter.position;
    }

    if (beforePosition && afterPosition && beforePosition >= afterPosition) {
      throw new BadRequestException(
        'Invalid chapter order: before chapter must come before after chapter',
      );
    }

    try {
      const newPosition = FractionalIndexingHelper.generateIndex(
        beforePosition,
        afterPosition,
      );

      chapter.position = newPosition;
      return await this.chapterRepository.save(chapter);
    } catch (error) {
      throw new BadRequestException(
        `Unable to reorder chapter: ${error.message}`,
      );
    }
  }

  async findAllChaptersInVolume(volumeId: string): Promise<{
    volume: Partial<Volume>;
    chapters: (Chapter & { visualPosition: number })[];
  }> {
    const volume = await this.volumeRepository.findOne({
      where: { id: volumeId },
      relations: ['story'],
    });

    if (!volume) {
      throw new NotFoundException('Volume not found');
    }

    const chapters = await this.chapterRepository.find({
      where: { volume: { id: volume.id } },
      relations: ['volume'],
      order: { position: 'ASC' },
    });

    const chaptersWithGlobalPosition = await this.addGlobalVisualPositions(
      chapters,
      volume.story.id,
    );

    return {
      volume: {
        id: volume.id,
        title: volume.title,
        description: volume.description,
      },
      chapters: chaptersWithGlobalPosition,
    };
  }

  async findOneChapter(chapterId: string): Promise<ChapterWithNavigation> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const result = await this.enrichChapterWithNavigation(chapter);

    this.incrementViewCount(chapter).catch((error) => {
      console.error('Error incrementing view count:', error);
    });

    await this.storyService
      .incrementViewsCount(chapter.volume.story)
      .catch((error) => {
        console.error('Error incrementing view count:', error);
      });

    return result;
  }

  async findChapterBySlug(chapterSlug: string): Promise<ChapterWithNavigation> {
    const chapter = await this.chapterRepository.findOne({
      where: { slug: chapterSlug },
      relations: ['volume', 'volume.story'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const result = await this.enrichChapterWithNavigation(chapter);

    this.incrementViewCount(chapter).catch((error) => {
      console.error('Error incrementing view count:', error);
    });

    await this.storyService
      .incrementViewsCount(chapter.volume.story)
      .catch((error) => {
        console.error('Error incrementing view count:', error);
      });

    return result;
  }

  private async enrichChapterWithNavigation(
    chapter: Chapter,
  ): Promise<ChapterWithNavigation> {
    const storyId = chapter.volume.story.id;

    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
    });

    const volumeIds = volumes.map((v) => v.id);

    // Buscar todos os capítulos publicados
    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
      select: ['id', 'title', 'slug', 'position', 'volume'],
    });

    // Criar lista ordenada de capítulos
    const orderedChapters: (Chapter & { volumeTitle: string })[] = [];
    const volumeMap = new Map(volumes.map((v) => [v.id, v.title]));

    for (const volume of volumes) {
      const volumeChapters = allChapters
        .filter((ch) => ch.volume.id === volume.id)
        .sort((a, b) =>
          FractionalIndexingHelper.compare(a.position, b.position),
        )
        .map((ch) => ({
          ...ch,
          volumeTitle: volumeMap.get(volume.id) || '',
        }));
      orderedChapters.push(...volumeChapters);
    }

    // Encontrar índice do capítulo atual
    const currentIndex = orderedChapters.findIndex(
      (ch) => ch.id === chapter.id,
    );

    // Capítulo anterior
    const previous =
      currentIndex > 0
        ? {
            id: orderedChapters[currentIndex - 1].id,
            title: orderedChapters[currentIndex - 1].title,
            slug: orderedChapters[currentIndex - 1].slug,
            volumeTitle: orderedChapters[currentIndex - 1].volumeTitle,
          }
        : null;

    // Próximo capítulo
    const next =
      currentIndex < orderedChapters.length - 1
        ? {
            id: orderedChapters[currentIndex + 1].id,
            title: orderedChapters[currentIndex + 1].title,
            slug: orderedChapters[currentIndex + 1].slug,
            volumeTitle: orderedChapters[currentIndex + 1].volumeTitle,
          }
        : null;

    return {
      ...chapter,
      visualPosition: currentIndex + 1,
      navigation: {
        previous,
        next,
        totalChapters: orderedChapters.length,
      },
    };
  }

  async getChapterNavigation(chapterId: string): Promise<{
    previous: { id: string; title: string; slug: string } | null;
    next: { id: string; title: string; slug: string } | null;
    current: { visualPosition: number; totalChapters: number };
  }> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story'],
      select: ['id', 'position', 'volume'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const storyId = chapter.volume.story.id;

    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
      select: ['id', 'createdAt'],
    });

    const volumeIds = volumes.map((v) => v.id);

    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
      select: ['id', 'title', 'slug', 'position', 'volume'],
    });

    const orderedChapters: Chapter[] = [];
    for (const volume of volumes) {
      const volumeChapters = allChapters
        .filter((ch) => ch.volume.id === volume.id)
        .sort((a, b) =>
          FractionalIndexingHelper.compare(a.position, b.position),
        );
      orderedChapters.push(...volumeChapters);
    }

    const currentIndex = orderedChapters.findIndex((ch) => ch.id === chapterId);

    return {
      previous:
        currentIndex > 0
          ? {
              id: orderedChapters[currentIndex - 1].id,
              title: orderedChapters[currentIndex - 1].title,
              slug: orderedChapters[currentIndex - 1].slug,
            }
          : null,
      next:
        currentIndex < orderedChapters.length - 1
          ? {
              id: orderedChapters[currentIndex + 1].id,
              title: orderedChapters[currentIndex + 1].title,
              slug: orderedChapters[currentIndex + 1].slug,
            }
          : null,
      current: {
        visualPosition: currentIndex + 1,
        totalChapters: orderedChapters.length,
      },
    };
  }

  async updateChapter(
    chapterId: string,
    authorId: string,
    updateChapterDto: UpdateChapterDto,
  ) {
    const user = await this.userRepository.findOneBy({ id: authorId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story', 'volume.story.author'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.volume.story.author.id !== authorId) {
      throw new ForbiddenException('You are not the author of this story');
    }

    chapter.title = updateChapterDto.title ?? chapter.title;
    chapter.content = updateChapterDto.content ?? chapter.content;
    chapter.isDraft = updateChapterDto.isDraft ?? chapter.isDraft;
    chapter.slug = updateChapterDto.title
      ? createSlug(updateChapterDto.title)
      : chapter.slug;
    chapter.wordsCount = updateChapterDto.content
      ? countWords(updateChapterDto.content)
      : chapter.wordsCount;

    if (chapter.isDraft && updateChapterDto.isDraft === false) {
      chapter.publishedAt = new Date();
    }

    if (!chapter.isDraft && updateChapterDto.isDraft === true) {
      await this.storyService.incrementPublishedChaptersCount(
        chapter.volume.story,
      );
    }

    if (updateChapterDto.isDraft === false) {
      await this.storyService.incrementPublishedChaptersCount(
        chapter.volume.story,
      );
    }

    if (chapter.wordsCount !== countWords(chapter.content)) {
      const storyWordsCount =
        chapter.volume.story.wordsCount -
        chapter.wordsCount +
        countWords(chapter.content);
      await this.storyService.changeWordsCount(
        chapter.volume.story,
        storyWordsCount,
      );
    }

    return this.chapterRepository.save(chapter);
  }

  async removeChapter(chapterId: string, authorId: string) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story', 'volume.story.author'],
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    if (chapter.volume.story.author.id !== authorId) {
      throw new ForbiddenException('You are not the author of this story');
    }

    await this.volumeRepository.save({
      ...chapter.volume,
      chaptersCount: chapter.volume.chaptersCount - 1,
    });

    await this.storyRepository.save({
      ...chapter.volume.story,
      chaptersCount: chapter.volume.story.chaptersCount - 1,
    });

    return this.chapterRepository.remove(chapter);
  }

  private async addGlobalVisualPositions<
    T extends { id: string; position: string; volume: { id: string } },
  >(
    chapters: T[],
    storyId?: string,
  ): Promise<(T & { visualPosition: number })[]> {
    if (chapters.length === 0) return [];

    // Se não tiver storyId, buscar do primeiro capítulo
    if (!storyId && chapters[0]?.volume) {
      const volume = await this.volumeRepository.findOne({
        where: { id: chapters[0].volume.id },
        relations: ['story'],
        select: ['id', 'story'],
      });
      storyId = volume?.story?.id;
    }

    if (!storyId) {
      throw new Error('Story ID is required to calculate global positions');
    }

    // Buscar volumes ordenados
    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
      select: ['id', 'createdAt'],
    });

    const volumeIds = volumes.map((v) => v.id);

    // CORREÇÃO: Buscar apenas capítulos publicados com uma query
    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
      select: ['id', 'position', 'volume'],
    });

    // Construir mapa de posições
    const positionMap = this.buildPositionMap(volumes, allChapters);

    // Mapear capítulos com suas posições
    return chapters.map((chapter) => ({
      ...chapter,
      visualPosition: positionMap.get(chapter.id) || 1,
    }));
  }

  async getChapterPosition(chapterId: string): Promise<{
    visualPosition: number;
    totalChapters: number;
  }> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const storyId = chapter.volume.story.id;

    // CORREÇÃO: Contar apenas capítulos publicados
    const totalChapters = await this.chapterRepository.count({
      where: {
        volume: { story: { id: storyId } },
        isDraft: false,
      },
    });

    const chaptersWithPosition = await this.addGlobalVisualPositions(
      [chapter],
      storyId,
    );

    return {
      visualPosition: chaptersWithPosition[0]?.visualPosition || 1,
      totalChapters,
    };
  }

  private buildPositionMap(
    volumes: Volume[],
    allChapters: Chapter[],
  ): Map<string, number> {
    const positionMap = new Map<string, number>();
    let globalPosition = 1;

    const chaptersByVolume = volumes.map((volume) => ({
      volumeId: volume.id,
      chapters: allChapters
        .filter((chapter) => chapter.volume.id === volume.id)
        .sort((a, b) =>
          FractionalIndexingHelper.compare(a.position, b.position),
        ),
    }));

    for (const volumeGroup of chaptersByVolume) {
      for (const chapter of volumeGroup.chapters) {
        positionMap.set(chapter.id, globalPosition);
        globalPosition++;
      }
    }

    return positionMap;
  }

  async addGlobalVisualPositionsWithStoryId<
    T extends { id: string; position: string },
  >(
    chapters: T[],
    storyId: string,
  ): Promise<(T & { visualPosition: number })[]> {
    if (chapters.length === 0) return [];

    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
      select: ['id', 'createdAt'],
    });

    const volumeIds = volumes.map((v) => v.id);

    // Buscar capítulos publicados
    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
      select: ['id', 'position', 'volume'],
    });

    const positionMap = this.buildPositionMap(volumes, allChapters);

    // Ordenar os capítulos de entrada por position
    const sortedChapters = [...chapters].sort((a, b) =>
      FractionalIndexingHelper.compare(a.position, b.position),
    );

    return sortedChapters.map((chapter) => ({
      ...chapter,
      visualPosition: positionMap.get(chapter.id) || 1,
    }));
  }

  async getChapterVisualPosition(chapterId: string): Promise<number> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const storyId = chapter.volume.story.id;

    // CORREÇÃO: Buscar apenas uma vez
    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
      select: ['id', 'createdAt'],
    });

    const volumeIds = volumes.map((v) => v.id);

    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
      select: ['id', 'position', 'volume'],
    });

    const positionMap = this.buildPositionMap(volumes, allChapters);

    return positionMap.get(chapterId) || 1;
  }

  async findAllChaptersInStory(storyId: string): Promise<{
    story: Partial<Story>;
    volumes: Array<{
      volume: Partial<Volume>;
      chapters: Array<Chapter & { visualPosition: number }>;
    }>;
  }> {
    const story = await this.storyRepository.findOneBy({ id: storyId });
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
    });

    const volumeIds = volumes.map((v) => v.id);

    // Buscar todos os capítulos de uma vez
    const allChapters = await this.chapterRepository.find({
      where: {
        volume: { id: In(volumeIds) },
        isDraft: false,
      },
      relations: ['volume'],
    });

    const positionMap = this.buildPositionMap(volumes, allChapters);

    // Adicionar visualPosition aos capítulos
    const chaptersWithPosition = allChapters.map((chapter) => ({
      ...chapter,
      visualPosition: positionMap.get(chapter.id) || 1,
    }));

    // Agrupar por volume
    const volumesWithChapters = volumes.map((volume) => {
      const volumeChapters = chaptersWithPosition
        .filter((chapter) => chapter.volume.id === volume.id)
        .sort((a, b) => a.visualPosition - b.visualPosition);

      return {
        volume: {
          id: volume.id,
          title: volume.title,
          description: volume.description,
          createdAt: volume.createdAt,
          chaptersCount: volumeChapters.length,
        },
        chapters: volumeChapters,
      };
    });

    return {
      story: {
        id: story.id,
        title: story.title,
        synopsis: story.synopsis,
        chaptersCount: chaptersWithPosition.length,
      },
      volumes: volumesWithChapters,
    };
  }

  private async incrementViewCount(chapter: Chapter): Promise<void> {
    chapter.viewsCount += 1;
    await this.chapterRepository.save(chapter);
  }

  private async getNextGlobalPosition(storyId: string): Promise<number> {
    const totalChapters = await this.chapterRepository.count({
      where: { volume: { story: { id: storyId } } },
    });
    return totalChapters + 1;
  }
}
