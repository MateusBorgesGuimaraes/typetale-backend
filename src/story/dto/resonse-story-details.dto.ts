import { Story } from '../entities/story.entity';

export class ResponseStoryDetailsDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string;
  readonly synopsis: string;
  readonly storyType: string;
  readonly mainGenre: string;
  readonly language: string;
  readonly status: string;
  readonly tags: string[];
  readonly chaptersCount: number;
  readonly publishedChaptersCount: number;
  readonly followersCount: number;
  readonly viewsCount: number;
  readonly wordsCount: number;
  readonly ratingAvg?: number;
  readonly ratingCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author?: {
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
    this.synopsis = story.synopsis;
    this.storyType = story.storyType;
    this.mainGenre = story.mainGenre;
    this.language = story.language;
    this.status = story.status;
    this.tags = story.tags;
    this.chaptersCount = story.chaptersCount;
    this.publishedChaptersCount = story.publishedChaptersCount;
    this.followersCount = story.followersCount;
    this.viewsCount = story.viewsCount;
    this.wordsCount = story.wordsCount;
    this.ratingAvg = story.ratingAvg;
    this.ratingCount = story.ratingCount;
    this.createdAt = story.createdAt;
    this.updatedAt = story.updatedAt;
    if (story.author) {
      this.author = {
        id: story.author.id,
        username: story.author.username,
        email: story.author.email,
        avatarUrl: story.author.avatarUrl,
      };
    }
  }
}
