import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ReadingProgress } from './entities/reading-progress.entity';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { ResponseReadingProgressDto } from './dto/response-reading-progress.dto';
import { User } from 'src/user/entities/user.entity';
import { Story } from 'src/story/entities/story.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { Volume } from 'src/volume/entities/volume.entity';
import { FractionalIndexingHelper } from 'src/common/utils/fractional-indexing-helper';
import { ChapterService } from 'src/chapter/chapter.service';

@Injectable()
export class ReadingProgressService {
  private readonly logger = new Logger(ReadingProgressService.name);

  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepository: Repository<ReadingProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
  ) {}

  async updateProgress(dto: UpdateReadingProgressDto, userId: string) {
    try {
      // Verificar usuário
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verificar história
      const story = await this.storyRepository.findOneBy({ id: dto.storyId });
      if (!story) {
        throw new NotFoundException('Story not found');
      }

      // Verificar que o capítulo pertence à história E não é rascunho
      const chapter = await this.chapterRepository.findOne({
        where: {
          id: dto.chapterId,
          volume: { story: { id: dto.storyId } },
          isDraft: false,
        },
        relations: ['volume', 'volume.story'],
      });

      if (!chapter) {
        throw new NotFoundException(
          'Chapter not found, does not belong to this story, or is a draft',
        );
      }

      // Buscar progresso existente
      let progress = await this.progressRepository.findOne({
        where: { user: { id: user.id }, story: { id: story.id } },
        relations: ['chapter', 'chapter.volume'],
      });

      // Se não existe progresso, criar novo
      if (!progress) {
        progress = this.progressRepository.create({ user, story, chapter });
        await this.progressRepository.save(progress);
        return {
          updated: true,
          progress: new ResponseReadingProgressDto(progress),
        };
      }

      // Se force=true, atualizar direto
      if (dto.force) {
        progress.chapter = chapter;
        await this.progressRepository.save(progress);
        return {
          updated: true,
          progress: new ResponseReadingProgressDto(progress),
        };
      }

      // Verificar se é o próximo capítulo sequencial
      const isSequential = await this.isNextChapter(
        progress.chapter,
        chapter,
        story.id,
      );

      if (isSequential) {
        progress.chapter = chapter;
        await this.progressRepository.save(progress);
        return {
          updated: true,
          progress: new ResponseReadingProgressDto(progress),
        };
      }

      return {
        updated: false,
        needsConfirmation: true,
        progress: new ResponseReadingProgressDto(progress),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to update reading progress: ${error.message}`,
      );
    }
  }

  private async isNextChapter(
    current: Chapter,
    next: Chapter,
    storyId: string,
  ): Promise<boolean> {
    try {
      const volumes = await this.volumeRepository.find({
        where: { story: { id: storyId } },
        order: { createdAt: 'ASC' },
        select: ['id', 'createdAt'],
      });

      if (volumes.length === 0) {
        return false;
      }

      const volumeIds = volumes.map((v) => v.id);

      const allChapters = await this.chapterRepository.find({
        where: {
          volume: { id: In(volumeIds) },
          isDraft: false,
        },
        relations: ['volume'],
        select: ['id', 'position', 'volume'],
      });

      if (allChapters.length === 0) {
        return false;
      }

      const chaptersByVolume = volumes.map((volume) => ({
        volumeId: volume.id,
        chapters: allChapters
          .filter((chapter) => chapter.volume.id === volume.id)
          .sort((a, b) =>
            FractionalIndexingHelper.compare(a.position, b.position),
          ),
      }));

      const orderedChapters: Chapter[] = [];
      for (const volumeGroup of chaptersByVolume) {
        orderedChapters.push(...volumeGroup.chapters);
      }

      const currentIdx = orderedChapters.findIndex((c) => c.id === current.id);
      const nextIdx = orderedChapters.findIndex((c) => c.id === next.id);

      if (currentIdx === -1) {
        return false;
      }

      if (nextIdx === -1) {
        return false;
      }

      return nextIdx === currentIdx + 1;
    } catch (error) {
      return false;
    }
  }

  async getProgress(userId: string, storyId: string) {
    try {
      const progress = await this.progressRepository.findOne({
        where: { user: { id: userId }, story: { id: storyId } },
        relations: ['chapter', 'story'],
      });

      if (!progress) {
        throw new NotFoundException('Progress not found');
      }

      return new ResponseReadingProgressDto(progress);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve reading progress',
      );
    }
  }

  async getAllProgresses(userId: string) {
    try {
      const progresses = await this.progressRepository.find({
        where: { user: { id: userId } },
        relations: [
          'chapter',
          'chapter.volume',
          'chapter.volume.story',
          'story',
        ],
        order: { updatedAt: 'DESC' },
      });

      if (progresses.length === 0) {
        return [];
      }

      const progressesByStory = new Map<string, typeof progresses>();
      progresses.forEach((progress) => {
        const storyId = progress.story.id;
        if (!progressesByStory.has(storyId)) {
          progressesByStory.set(storyId, []);
        }
        progressesByStory.get(storyId)!.push(progress);
      });

      const progressesWithPosition: any[] = [];

      for (const [storyId, storyProgresses] of progressesByStory.entries()) {
        try {
          const allChapters = await this.chapterRepository.find({
            where: { volume: { story: { id: storyId } }, isDraft: false },
            relations: ['volume'],
            select: ['id', 'position', 'volume'],
          });

          const volumes = await this.volumeRepository.find({
            where: { story: { id: storyId } },
            order: { createdAt: 'ASC' },
            select: ['id', 'createdAt'],
          });

          const positionMap = this.buildPositionMap(volumes, allChapters);
          const totalChapters = allChapters.length;

          for (const progress of storyProgresses) {
            const visualPosition = positionMap.get(progress.chapter.id) || 1;
            progressesWithPosition.push({
              ...new ResponseReadingProgressDto(progress),
              chapterPosition: visualPosition,
              totalChapters,
            });
          }
        } catch (error) {
          for (const progress of storyProgresses) {
            progressesWithPosition.push(
              new ResponseReadingProgressDto(progress),
            );
          }
        }
      }

      return progressesWithPosition.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve reading progresses',
      );
    }
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

  async deleteProgress(userId: string, storyId: string): Promise<void> {
    try {
      const result = await this.progressRepository.delete({
        user: { id: userId },
        story: { id: storyId },
      });

      if (result.affected === 0) {
        throw new NotFoundException('Progress not found');
      }
    } catch (error) {
      this.logger.error('Error deleting progress:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to delete reading progress',
      );
    }
  }
}
