import { Story } from 'src/story/entities/story.entity';
import { User } from '../entities/user.entity';

export class ResponseUserDto {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly avatarUrl: string | undefined;
  readonly role: string;
  readonly stories: Story[] | undefined;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.stories = user.stories;
  }
}
