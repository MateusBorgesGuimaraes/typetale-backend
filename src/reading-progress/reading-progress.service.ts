import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from './entities/reading-progress.entity';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { ResponseReadingProgressDto } from './dto/response-reading-progress.dto';
import { User } from 'src/user/entities/user.entity';
import { Story } from 'src/story/entities/story.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';
import { FractionalIndexingHelper } from 'src/common/utils/fractional-indexing-helper';
import { ChapterService } from 'src/chapter/chapter.service';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepository: Repository<ReadingProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly chapterService: ChapterService,
  ) {}

  async updateProgress(dto: UpdateReadingProgressDto, userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    const story = await this.storyRepository.findOneBy({ id: dto.storyId });
    const chapter = await this.chapterRepository.findOneBy({
      id: dto.chapterId,
    });
    if (!user || !story || !chapter)
      throw new NotFoundException('User, story or chapter not found');

    let progress = await this.progressRepository.findOne({
      where: { user: { id: user.id }, story: { id: story.id } },
      relations: ['chapter'],
    });

    if (!progress) {
      progress = this.progressRepository.create({ user, story, chapter });
      await this.progressRepository.save(progress);
      return {
        updated: true,
        progress: new ResponseReadingProgressDto(progress),
      };
    }

    const isSequential = await this.isNextChapter(
      progress.chapter,
      chapter,
      story,
    );
    if (isSequential || dto.force) {
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
  }

  private async isNextChapter(current: Chapter, next: Chapter, story: Story) {
    const volumes = await this.chapterRepository.manager
      .getRepository('Volume')
      .find({
        where: { story: { id: story.id } },
        order: { createdAt: 'ASC' },
        relations: ['chapters'],
      });

    const allChapters: Chapter[] = [];
    for (const volume of volumes) {
      const ordered = (volume.chapters || []).sort((a, b) =>
        FractionalIndexingHelper.compare(a.position, b.position),
      );
      allChapters.push(...ordered);
    }

    const currentIdx = allChapters.findIndex((c) => c.id === current.id);
    const nextIdx = allChapters.findIndex((c) => c.id === next.id);
    return nextIdx === currentIdx + 1;
  }

  async getProgress(userId: string, storyId: string) {
    const progress = await this.progressRepository.findOne({
      where: { user: { id: userId }, story: { id: storyId } },
      relations: ['chapter'],
    });
    if (!progress) throw new NotFoundException('Progress not found');
    return new ResponseReadingProgressDto(progress);
  }

  async getAllProgresses(userId: string) {
    const progresses = await this.progressRepository.find({
      where: { user: { id: userId } },
      relations: ['chapter', 'story'],
      order: { updatedAt: 'DESC' },
    });

    // Agora você pode usar o ChapterService
    const progressesWithPosition = await Promise.all(
      progresses.map(async (progress) => {
        try {
          const chapterPosition = await this.chapterService.getChapterPosition(
            progress.chapter.id,
          );

          return {
            ...new ResponseReadingProgressDto(progress),
            chapterPosition: chapterPosition.visualPosition,
            totalChapters: chapterPosition.totalChapters,
          };
        } catch (error) {
          // Se não conseguir obter a posição, retorna sem ela
          return new ResponseReadingProgressDto(progress);
        }
      }),
    );

    return progressesWithPosition;
  }
}
