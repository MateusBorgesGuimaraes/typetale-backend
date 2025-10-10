import { ReadingProgress } from '../entities/reading-progress.entity';

export class ResponseReadingProgressDto {
  readonly id: string;
  readonly userId: string;
  readonly story?: {
    id: string;
    title: string;
    slug: string;
    coverUrl?: string;
  };
  readonly chapterId?: {
    id: string;
    title: string;
    slug: string;
  };
  readonly updatedAt: Date;

  constructor(progress: ReadingProgress) {
    this.id = progress.id;
    this.userId = progress.user.id;
    if (progress.story)
      this.story = {
        id: progress.story.id,
        title: progress.story.title,
        slug: progress.story.slug,
        coverUrl: progress.story.coverUrl,
      };
    if (progress.chapter)
      this.chapterId = {
        id: progress.chapter.id,
        title: progress.chapter.title,
        slug: progress.chapter.slug,
      };
    this.updatedAt = progress.updatedAt;
  }
}
