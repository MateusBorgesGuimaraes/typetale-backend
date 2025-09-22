import { Story } from 'src/story/entities/story.entity';
import { Volume } from 'src/volume/entities/volume.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Volume, (volume) => volume.chapters, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  volume?: Volume;

  @Column()
  title: string;

  @Column()
  @Index()
  slug: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isDraft: boolean;

  @Column({ type: 'float' })
  position: number;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ default: 0 })
  wordsCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
