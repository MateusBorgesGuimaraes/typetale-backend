import { ResponseReadingProgressDto } from '../../reading-progress/dto/response-reading-progress.dto';

export class ResponseLibraryEntryDto {
  id: string;
  storyId: string;
  storyTitle: string;
  coverUrl: string;
  readingProgress?: ResponseReadingProgressDto;
}
