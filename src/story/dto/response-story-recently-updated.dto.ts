import { Story } from '../entities/story.entity';

export class ResponseRecentlyUpdatedStoryDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly coverUrl: string;
  readonly storyType: string;
  readonly mainGenre: string;
  readonly lastChapter: {
    id: string;
    title: string;
    slug: string;
    publishedAt: Date;
    chapterNumber: number;
  };
  readonly author?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };

  constructor(story: Story) {
    this.id = story.id;
    this.title = story.title;
    this.slug = story.slug;
    this.coverUrl = story.coverUrl;
    this.storyType = story.storyType;
    this.mainGenre = story.mainGenre;

    const allChapters = story.volumes?.flatMap((v) => v.chapters) || [];
    const publishedChapters = allChapters
      .filter((c) => !c.isDraft && c.publishedAt)
      .sort(
        (a, b) =>
          new Date(b.publishedAt!).getTime() -
          new Date(a.publishedAt!).getTime(),
      );

    const latest = publishedChapters[0];

    this.lastChapter = {
      id: latest.id,
      title: latest.title,
      slug: latest.slug,
      publishedAt: latest.publishedAt || new Date(),
      chapterNumber: story.chaptersCount,
    };

    if (story.author) {
      this.author = {
        id: story.author.id,
        username: story.author.username,
        avatarUrl: story.author.avatarUrl,
      };
    }
  }
}
