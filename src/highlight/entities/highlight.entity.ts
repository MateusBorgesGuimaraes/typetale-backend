import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('highlights')
export class Highlight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  banner: string;

  @Column({ type: 'text' })
  link: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
