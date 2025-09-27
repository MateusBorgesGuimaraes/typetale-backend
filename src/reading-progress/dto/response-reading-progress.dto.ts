import { ReadingProgress } from '../entities/reading-progress.entity';

export class ResponseReadingProgressDto {
  readonly id: string;
  readonly userId: string;
  readonly storyId: string;
  readonly chapterId: string;
  readonly updatedAt: Date;

  constructor(progress: ReadingProgress) {
    this.id = progress.id;
    this.userId = progress.user.id;
    this.storyId = progress.story.id;
    this.chapterId = progress.chapter.id;
    this.updatedAt = progress.updatedAt;
  }
}
