import { IsUUID } from 'class-validator';

export class AddToLibraryDto {
  @IsUUID()
  storyId: string;
}
