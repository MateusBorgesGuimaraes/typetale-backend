import { Highlight } from '../entities/highlight.entity';

export class ResponseHighlightDto {
  readonly id: string;
  readonly title: string;
  readonly banner: string;
  readonly link: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };

  constructor(highlight: Highlight) {
    this.id = highlight.id;
    this.title = highlight.title;
    this.banner = highlight.banner;
    this.link = highlight.link;
    this.isActive = highlight.isActive;
    this.createdAt = highlight.createdAt;
    this.updatedAt = highlight.updatedAt;
    this.author = {
      id: highlight.author.id,
      username: highlight.author.username,
      email: highlight.author.email,
      avatarUrl: highlight.author.avatarUrl,
    };
  }
}
