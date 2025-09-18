import { Story } from '../entities/story.entity';

export class ResponseStoryDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string;
  readonly synopsis: string;
  readonly mainGenre: string;
  readonly tags: string[];
  readonly ratingAvg?: number;
  readonly ratingCount: number;
  readonly createdAt: Date;
  readonly author: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };

  constructor(story: Story) {
    this.id = story.id;
    this.title = story.title;
    this.slug = story.slug;
    this.coverUrl = story.coverUrl;
    this.mainGenre = story.mainGenre;
    this.ratingAvg = story.ratingAvg;
    this.tags = story.tags;
    this.ratingCount = story.ratingCount;
    this.synopsis = story.synopsis;
    this.createdAt = story.createdAt;
    this.author = {
      id: story.author.id,
      username: story.author.username,
      email: story.author.email,
      avatarUrl: story.author.avatarUrl,
    };
  }
}
