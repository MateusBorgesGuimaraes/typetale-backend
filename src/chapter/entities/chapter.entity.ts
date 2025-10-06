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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Volume, (volume) => volume.chapters, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  volume: Volume;

  @Column()
  title: string;

  @Column()
  @Index()
  slug: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isDraft: boolean;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  position: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  publishedAt: Date | null;

  @Column({ default: 0 })
  wordsCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
