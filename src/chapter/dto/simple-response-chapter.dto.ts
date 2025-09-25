import { Chapter } from '../entities/chapter.entity';
import { Volume } from 'src/volume/entities/volume.entity';

export class SimpleResponseChapterDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly position: string;
  readonly publishedAt?: Date;
  readonly wordsCount: number;
  readonly viewsCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(chapter: Chapter) {
    this.id = chapter.id;
    this.title = chapter.title;
    this.slug = chapter.slug;
    this.position = chapter.position;
    this.publishedAt = chapter.publishedAt || undefined;
    this.wordsCount = chapter.wordsCount;
    this.viewsCount = chapter.viewsCount;
    this.createdAt = chapter.createdAt;
    this.updatedAt = chapter.updatedAt;
  }
}
