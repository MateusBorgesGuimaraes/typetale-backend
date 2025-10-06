import { Volume } from '../entities/volume.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';

export class ResponseVolumeDto {
  readonly id: string;
  readonly title: string;
  readonly chaptersCount: number;
  readonly description?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly story?: { id: string; title: string; coverUrl?: string };
  readonly chapters?: {
    id: string;
    title: string;
    position: string;
  }[];

  constructor(volume: Volume) {
    this.id = volume.id;
    this.title = volume.title;
    this.chaptersCount = volume.chaptersCount;
    this.description = volume.description;
    this.createdAt = volume.createdAt;
    this.updatedAt = volume.updatedAt;
    if (volume.story) {
      this.story = {
        id: volume.story.id,
        title: volume.story.title,
        coverUrl: volume.story.coverUrl,
      };
    }
    if (volume.chapters) {
      this.chapters = volume.chapters.map((chapter: Chapter) => ({
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
      }));
    }
  }
}
