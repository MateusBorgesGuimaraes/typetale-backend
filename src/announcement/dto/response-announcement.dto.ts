import { Announcement } from '../entities/announcement.entity';

export class ResponseAnnouncementDto {
  readonly id: string;
  readonly title: string;
  readonly image?: string;
  readonly content: string;
  readonly publishedAt?: Date;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly author: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };

  constructor(announcement: Announcement) {
    this.id = announcement.id;
    this.title = announcement.title;
    this.image = announcement.image;
    this.content = announcement.content;
    this.publishedAt = announcement.publishedAt;
    this.isActive = announcement.isActive;
    this.createdAt = announcement.createdAt;
    this.updatedAt = announcement.updatedAt;
    this.author = {
      id: announcement.author.id,
      username: announcement.author.username,
      email: announcement.author.email,
      avatarUrl: announcement.author.avatarUrl,
    };
  }
}
