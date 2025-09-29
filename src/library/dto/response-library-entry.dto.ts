import { LibraryEntry } from '../entities/library-entry.entity';

export class ResponseLibraryEntryDto {
  id: string;
  storyId: string;
  storyTitle: string;
  coverUrl: string;
  readingProgress?: {
    visualPosition?: number;
    totalChapters?: number;
  };

  constructor(
    libraryEntry: LibraryEntry,
    chapterPosition?: { visualPosition: number; totalChapters: number },
  ) {
    this.id = libraryEntry.id;
    this.storyId = libraryEntry.story.id;
    this.storyTitle = libraryEntry.story.title;
    this.coverUrl = libraryEntry.story.coverUrl;
    if (libraryEntry.readingProgress && chapterPosition) {
      this.readingProgress = {
        visualPosition: chapterPosition?.visualPosition,
        totalChapters: chapterPosition?.totalChapters,
      };
    }
  }
}
