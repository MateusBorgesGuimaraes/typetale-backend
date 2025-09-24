import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Story } from 'src/story/entities/story.entity';
import { Chapter } from 'src/chapter/entities/chapter.entity';

@Entity('volumes')
export class Volume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Story, (story) => story.volumes, { onDelete: 'CASCADE' })
  story: Story;

  @Column()
  title: string;

  @Column({ default: 0 })
  chaptersCount: number;

  @Column()
  description?: string;

  @Column({ type: 'float' })
  position: number;

  @OneToMany(() => Chapter, (chapter) => chapter.volume)
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
