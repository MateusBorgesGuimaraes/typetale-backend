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
import { Repository } from 'typeorm';
import { Volume } from 'src/volume/entities/volume.entity';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';
import { FractionalIndexingHelper } from 'src/common/utils/fractional-indexing-helper';
import { countWords } from 'src/common/utils/words-count';
import { StoryService } from 'src/story/story.service';

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
      publishedAt: createChapterDto.isDraft ? undefined : new Date(),
      position: nextPosition,
      wordsCount,
      volume,
    });

    await this.volumeRepository.save({
      ...volume,
      chaptersCount: volume.chaptersCount + 1,
    });

    await this.storyService.incrementChaptersCount(volume.story);

    if (chapter.isDraft) {
      await this.storyService.incrementPublishedChaptersCount(volume.story);
    }

    await this.storyService.changeWordsCount(volume.story, wordsCount);

    const savedChapter = await this.chapterRepository.save(chapter);

    return {
      ...savedChapter,
      visualPosition: globalPosition,
    };
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

  async findOneChapter(chapterId: string) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume', 'volume.story'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const chaptersWithPosition = await this.addGlobalVisualPositions(
      [chapter],
      chapter.volume.story.id,
    );

    await this.incrementViewCount(chapter);

    return {
      ...chapter,
      visualPosition: chaptersWithPosition[0]?.visualPosition || 1,
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

    if (!storyId && chapters[0]?.volume) {
      const volume = await this.volumeRepository.findOne({
        where: { id: chapters[0].volume.id },
        relations: ['story'],
      });
      storyId = volume?.story?.id;
    }

    if (!storyId) {
      throw new Error('Story ID is required to calculate global positions');
    }

    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      order: { createdAt: 'ASC' },
      select: ['id', 'createdAt'],
    });

    // Busca todos os capítulos de todos os volumes da história
    const allChapters = await this.chapterRepository.find({
      where: { volume: { story: { id: storyId } } },
      relations: ['volume'],
      select: ['id', 'position', 'volume'],
      order: { position: 'ASC' },
    });

    // Agrupa capítulos por volume
    const chaptersByVolume = volumes.map((volume) => ({
      volumeId: volume.id,
      chapters: allChapters
        .filter((chapter) => chapter.volume.id === volume.id)
        .sort((a, b) =>
          FractionalIndexingHelper.compare(a.position, b.position),
        ),
    }));

    // Calcula posições globais
    let globalPosition = 1;
    const positionMap = new Map<string, number>();

    for (const volumeGroup of chaptersByVolume) {
      for (const chapter of volumeGroup.chapters) {
        positionMap.set(chapter.id, globalPosition);
        globalPosition++;
      }
    }

    // Aplica as posições aos capítulos fornecidos
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
    const totalChapters = await this.chapterRepository.count({
      where: { volume: { story: { id: storyId } } },
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

  private async addGlobalVisualPositionsWithStoryId<
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

    const allChapters = await this.chapterRepository.find({
      where: { volume: { story: { id: storyId } } },
      relations: ['volume'],
      select: ['id', 'position', 'volume'],
    });

    const chaptersByVolume = volumes.map((volume) => ({
      volumeId: volume.id,
      chapters: allChapters
        .filter((chapter) => chapter.volume.id === volume.id)
        .sort((a, b) =>
          FractionalIndexingHelper.compare(a.position, b.position),
        ),
    }));

    let globalPosition = 1;
    const positionMap = new Map<string, number>();

    for (const volumeGroup of chaptersByVolume) {
      for (const chapter of volumeGroup.chapters) {
        positionMap.set(chapter.id, globalPosition);
        globalPosition++;
      }
    }

    const sortedChapters = [...chapters].sort((a, b) =>
      FractionalIndexingHelper.compare(a.position, b.position),
    );

    return sortedChapters.map((chapter) => ({
      ...chapter,
      visualPosition: positionMap.get(chapter.id) || 1,
    }));
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

    const allChapters = await this.chapterRepository.find({
      where: { volume: { story: { id: storyId } } },
      relations: ['volume'],
      order: { position: 'ASC' },
    });

    const chaptersWithGlobalPosition =
      await this.addGlobalVisualPositionsWithStoryId(allChapters, storyId);

    const volumesWithChapters = volumes.map((volume) => {
      const volumeChapters = chaptersWithGlobalPosition.filter(
        (chapter) => chapter.volume.id === volume.id,
      );

      return {
        volume: {
          id: volume.id,
          title: volume.title,
          description: volume.description,
          createdAt: volume.createdAt,
        },
        chapters: volumeChapters,
      };
    });

    return {
      story: {
        id: story.id,
        title: story.title,
        synopsis: story.synopsis,
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
