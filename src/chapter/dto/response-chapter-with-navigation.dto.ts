import { Chapter } from '../entities/chapter.entity';

export class ResponseChapterWithStoryDto {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly publishedAt?: Date;
  readonly wordsCount: number;
  readonly visualPosition: number;
  readonly viewsCount: number;

  readonly volume: {
    id: string;
    title: string;
    story: {
      id: string;
      title: string;
    };
  };

  readonly navigation: {
    previous: {
      id: string;
      title: string;
      slug: string;
      volumeTitle: string;
    } | null;
    next: {
      id: string;
      title: string;
      slug: string;
      volumeTitle: string;
    } | null;
    totalChapters: number;
  };

  constructor(
    chapter: Chapter & {
      visualPosition: number;
      volume: {
        id: string;
        title: string;
        story: {
          id: string;
          title: string;
        };
      };
      navigation: {
        previous: {
          id: string;
          title: string;
          slug: string;
          volumeTitle: string;
        } | null;
        next: {
          id: string;
          title: string;
          slug: string;
          volumeTitle: string;
        } | null;
        totalChapters: number;
      };
    },
  ) {
    this.id = chapter.id;
    this.title = chapter.title;
    this.slug = chapter.slug;
    this.content = chapter.content;
    this.publishedAt = chapter.publishedAt || undefined;
    this.wordsCount = chapter.wordsCount;
    this.visualPosition = chapter.visualPosition;
    this.viewsCount = chapter.viewsCount;

    this.volume = {
      id: chapter.volume.id,
      title: chapter.volume.title,
      story: {
        id: chapter.volume.story.id,
        title: chapter.volume.story.title,
      },
    };

    this.navigation = {
      previous: chapter.navigation.previous
        ? {
            id: chapter.navigation.previous.id,
            title: chapter.navigation.previous.title,
            slug: chapter.navigation.previous.slug,
            volumeTitle: chapter.navigation.previous.volumeTitle,
          }
        : null,
      next: chapter.navigation.next
        ? {
            id: chapter.navigation.next.id,
            title: chapter.navigation.next.title,
            slug: chapter.navigation.next.slug,
            volumeTitle: chapter.navigation.next.volumeTitle,
          }
        : null,
      totalChapters: chapter.navigation.totalChapters,
    };
  }
}
