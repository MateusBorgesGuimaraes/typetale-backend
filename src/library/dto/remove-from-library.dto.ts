import { IsUUID, IsArray } from 'class-validator';

export class RemoveFromLibraryDto {
  @IsArray()
  @IsUUID('all', { each: true })
  storyIds: string[];
}
