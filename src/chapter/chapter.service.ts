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

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter) private chapterRepository: Repository<Chapter>,
    @InjectRepository(Volume) private volumeRepository: Repository<Volume>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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
      // Incrementa a partir da última posição
      nextPosition = FractionalIndexingHelper.generateAfter(
        lastChapter.position,
      );
    }

    const wordsCount = countWords(createChapterDto.content);

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

    return this.chapterRepository.save(chapter);
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

  async findAllChaptersInVolume(
    volumeId: string,
  ): Promise<{ volume: Partial<Volume>; chapters: Chapter[] }> {
    const volume = await this.volumeRepository.findOneBy({
      id: volumeId,
    });

    if (!volume) {
      throw new NotFoundException('Volume not found');
    }

    const chapters = await this.chapterRepository.find({
      where: { volume: { id: volume.id } },
      relations: ['volume'],
      order: { position: 'ASC' },
    });

    return {
      volume: {
        id: volume.id,
        title: volume.title,
        description: volume.description,
        position: volume.position,
      },
      chapters: chapters,
    };
  }

  async findOneChapter(chapterId: string) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume'],
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
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
    return this.chapterRepository.remove(chapter);
  }
}
