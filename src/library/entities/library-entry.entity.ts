import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Story } from '../../story/entities/story.entity';
import { ReadingProgress } from '../../reading-progress/entities/reading-progress.entity';

@Entity()
@Unique(['user', 'story'])
export class LibraryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Story, { eager: true, onDelete: 'CASCADE' })
  story: Story;

  // Relacionamento opcional para progresso de leitura
  @ManyToOne(() => ReadingProgress, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  readingProgress?: ReadingProgress;
}
