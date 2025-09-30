import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryEntry } from './entities/library-entry.entity';
import { User } from '../user/entities/user.entity';
import { Story } from '../story/entities/story.entity';
import { AddToLibraryDto } from './dto/add-to-library.dto';
import { RemoveFromLibraryDto } from './dto/remove-from-library.dto';
import { ResponseLibraryEntryDto } from './dto/response-library-entry.dto';
import { ReadingProgress } from '../reading-progress/entities/reading-progress.entity';
import { ChapterService } from 'src/chapter/chapter.service';
import { StoryService } from 'src/story/story.service';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryEntry)
    private libraryRepository: Repository<LibraryEntry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    private readonly storyService: StoryService,
    @InjectRepository(ReadingProgress)
    private progressRepository: Repository<ReadingProgress>,
    private readonly chapterService: ChapterService,
  ) {}

  async addToLibrary(
    userId: string,
    dto: AddToLibraryDto,
  ): Promise<ResponseLibraryEntryDto | null> {
    const user = await this.userRepository.findOneBy({ id: userId });

    const story = await this.storyRepository.findOneBy({ id: dto.storyId });

    if (!user || !story) throw new NotFoundException('User or story not found');

    const exists = await this.libraryRepository.findOne({
      where: { user: { id: userId }, story: { id: dto.storyId } },
    });

    if (exists) throw new BadRequestException('Story already in library');
    const progress = await this.progressRepository.findOne({
      where: { user: { id: userId }, story: { id: dto.storyId } },
    });

    const entry = this.libraryRepository.create({ user, story });

    if (progress) entry.readingProgress = progress;

    await this.libraryRepository.save(entry);

    const savedEntry = await this.libraryRepository.findOne({
      where: { id: entry.id },
      relations: ['story', 'readingProgress'],
    });

    if (!savedEntry) throw new NotFoundException('Entry not found');

    await this.storyService.incrementFollowersCount(story);

    return new ResponseLibraryEntryDto(savedEntry);
  }

  async removeFromLibrary(userId: string, storyId: string): Promise<void> {
    const entry = await this.libraryRepository.findOne({
      where: { user: { id: userId }, story: { id: storyId } },
    });

    if (!entry) throw new NotFoundException('Entry not found');

    await this.storyService.decrementFollowersCount(entry.story);

    await this.libraryRepository.remove(entry);
  }

  async removeManyFromLibrary(
    userId: string,
    dto: RemoveFromLibraryDto,
  ): Promise<void> {
    await Promise.all(
      dto.storyIds.map((id) => {
        this.removeFromLibrary(userId, id);
        this.storyService.decrementFollowersCountById(id);
      }),
    );
  }

  async getLibrary(userId: string) {
    const entries = await this.libraryRepository.find({
      where: { user: { id: userId } },
      relations: ['story', 'readingProgress', 'readingProgress.chapter'],
    });

    const entriesWithChapterPosition = await Promise.all(
      entries.map(async (entry) => {
        let chapterPosition:
          | {
              visualPosition: number;
              totalChapters: number;
            }
          | undefined = undefined;

        if (entry.readingProgress && entry.readingProgress.chapter?.id) {
          try {
            chapterPosition = await this.chapterService.getChapterPosition(
              entry.readingProgress.chapter.id,
            );
          } catch (error) {
            console.warn(
              `Could not get chapter position for chapter ${entry.readingProgress.chapter.id}:`,
              error.message,
            );
          }
        }

        return new ResponseLibraryEntryDto(entry, chapterPosition);
      }),
    );

    return entriesWithChapterPosition;
  }
}
