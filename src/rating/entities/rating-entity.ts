import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['user', 'story'], { unique: true })
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Story, (story) => story.ratings, { onDelete: 'CASCADE' })
  story: Story;

  @Column({ type: 'int' })
  writingQuality: number;

  @Column({ type: 'int' })
  updateStability: number;

  @Column({ type: 'int' })
  plotDevelopment: number;

  @Column({ type: 'int' })
  charactersBuilding: number;

  @Column({ type: 'int' })
  worldBuilding: number;

  @CreateDateColumn()
  createdAt: Date;
}
