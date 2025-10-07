import { Story } from '../entities/story.entity';

export class ResponseStoryRankDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string;
  readonly storyType: string;
  readonly mainGenre: string;
  readonly ratingAvg?: number;
  readonly ratingCount: number;

  constructor(story: Story) {
    this.id = story.id;
    this.title = story.title;
    this.slug = story.slug;
    this.coverUrl = story.coverUrl;
    this.storyType = story.storyType;
    this.mainGenre = story.mainGenre;
    this.ratingAvg = story.ratingAvg;
    this.ratingCount = story.ratingCount;
  }
}
