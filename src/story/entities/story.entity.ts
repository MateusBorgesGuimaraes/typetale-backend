import { Rating } from 'src/rating/entities/rating-entity';
import { User } from 'src/user/entities/user.entity';
import { Volume } from 'src/volume/entities/volume.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StoryType {
  ORIGINAL = 'original',
  FANFIC = 'fanfic',
}

export enum StoryGenre {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  COMEDY = 'comedy',
  DRAMA = 'drama',
  FANTASY = 'fantasy',
  HORROR = 'horror',
  ROMANCE = 'romance',
  SCIFI = 'scifi',
  SLASH = 'slash',
  SUSPENSE = 'suspense',
  THRILLER = 'thriller',
  LITRPG = 'litRPG',
  ISEKAI = 'isekai',
  OTHER = 'other',
}

export enum StoryLanguage {
  ENGLISH = 'english',
  PORTUGUESE = 'portuguese',
  SPANISH = 'spanish',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
}

export enum StoryStatus {
  ONGOING = 'ONGOING',
  HIATUS = 'HIATUS',
  DROPPED = 'DROPPED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  coverUrl: string;

  @Column({ type: 'text' })
  storyType: StoryType;

  @Column({ type: 'text', default: StoryGenre.OTHER })
  mainGenre: StoryGenre;

  @Column({ type: 'text' })
  language: StoryLanguage;

  @Column({ type: 'text' })
  synopsis: string;

  @Column({ type: 'text', default: StoryStatus.ONGOING })
  status: StoryStatus;

  @Column({ type: 'simple-array' })
  tags: string[];

  @Column({ default: 0 })
  chaptersCount: number;

  @Column({ default: 0 })
  publishedChaptersCount: number;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  wordsCount: number;

  @Column({ type: 'float', nullable: true })
  ratingAvg?: number;

  @Column({ default: 0 })
  ratingCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Volume, (volume) => volume.story)
  volumes: Volume[];

  @OneToMany(() => Rating, (rating) => rating.story)
  ratings: Rating[];
}
