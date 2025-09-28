import { Chapter } from '../entities/chapter.entity';
import { Volume } from 'src/volume/entities/volume.entity';

export class ResponseChapterDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly isDraft: boolean;
  readonly position: string;
  readonly publishedAt?: Date;
  readonly wordsCount: number;
  readonly visualPosition: number;
  readonly viewsCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly volume: {
    id: string;
    title: string;
  };

  constructor(chapter: Chapter & { visualPosition: number }) {
    this.id = chapter.id;
    this.title = chapter.title;
    this.slug = chapter.slug;
    this.content = chapter.content;
    this.isDraft = chapter.isDraft;
    this.position = chapter.position;
    this.publishedAt = chapter.publishedAt || undefined;
    this.wordsCount = chapter.wordsCount;
    this.visualPosition = chapter.visualPosition;
    this.viewsCount = chapter.viewsCount;
    this.createdAt = chapter.createdAt;
    this.updatedAt = chapter.updatedAt;
    this.volume = {
      id: chapter.volume.id,
      title: chapter.volume.title,
    };
  }
}
