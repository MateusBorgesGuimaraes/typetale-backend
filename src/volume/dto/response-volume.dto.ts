import { Volume } from '../entities/volume.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';

export class ResponseVolumeDto {
  readonly id: number;
  readonly title: string;
  readonly chaptersCount: number;
  readonly description?: string;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly chapters?: {
    id: number;
    title: string;
    position: number;
  }[];

  constructor(volume: Volume) {
    this.id = volume.id;
    this.title = volume.title;
    this.chaptersCount = volume.chaptersCount;
    this.description = volume.description;
    this.position = volume.position;
    this.createdAt = volume.createdAt;
    this.updatedAt = volume.updatedAt;
    if (volume.chapters) {
      this.chapters = volume.chapters.map((chapter: Chapter) => ({
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
      }));
    }
  }
}
