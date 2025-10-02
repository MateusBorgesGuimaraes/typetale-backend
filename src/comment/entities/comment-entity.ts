import { Rating } from 'src/rating/entities/rating-entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum CommentTarget {
  CHAPTER = 'chapter',
  ANNOUCEMENT = 'annoucement',
  STORY = 'story',
}

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL' })
  user: User;

  @Column('text')
  body: string;

  @Column({ type: 'uuid' })
  targetType: CommentTarget;

  @Column()
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Rating, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  rating?: Rating;
}
