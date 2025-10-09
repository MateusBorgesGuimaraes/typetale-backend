import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ResponseChapterDto } from './dto/response-chapter.dto';
import { ReorderChapterDto } from './dto/reorder-chapter.dto';
import { SimpleResponseChapterDto } from './dto/simple-response-chapter.dto';
import { ResponseChapterWithStoryDto } from './dto/response-chapter-with-navigation.dto';

@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create/:volumeId')
  async createChapter(
    @Param('volumeId') volumeId: string,
    @Body() createChapterDto: CreateChapterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const chapter = await this.chapterService.createChapter(
      volumeId,
      req.user.id,
      createChapterDto,
    );
    return new ResponseChapterDto(chapter);
  }

  @Get('volume/:volumeId')
  async findAllChaptersInVolume(@Param('volumeId') volumeId: string) {
    const res = await this.chapterService.findAllChaptersInVolume(volumeId);
    return {
      volume: res.volume,
      chapters: res.chapters.map(
        (chapter) => new SimpleResponseChapterDto(chapter),
      ),
    };
  }

  @Get('story/:storyId/all')
  async findAllChaptersInStory(@Param('storyId') storyId: string) {
    const result = await this.chapterService.findAllChaptersInStory(storyId);

    return {
      story: result.story,
      volumes: result.volumes.map((volumeData) => ({
        volume: volumeData.volume,
        chapters: volumeData.chapters.map(
          (chapter) => new SimpleResponseChapterDto(chapter),
        ),
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reorder')
  async reorderChapter(
    @Param('id') id: string,
    @Body() reorderDto: ReorderChapterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    const chapter = await this.chapterService.reorderChapter(
      id,
      userId,
      reorderDto,
    );

    const updatedChapter = await this.chapterService.findOneChapter(chapter.id);
    return new ResponseChapterDto(updatedChapter);
  }

  @Get(':id')
  async findOneChapter(@Param('id') id: string) {
    const chapter = await this.chapterService.findOneChapter(id);
    return new ResponseChapterWithStoryDto(chapter);
  }

  @Get('slug/:slug')
  async findOneChapterBySlug(@Param('slug') slug: string) {
    const chapter = await this.chapterService.findChapterBySlug(slug);
    return new ResponseChapterWithStoryDto(chapter);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateChapter(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const chapter = await this.chapterService.updateChapter(
      id,
      req.user.id,
      updateChapterDto,
    );

    const updatedChapter = await this.chapterService.findOneChapter(chapter.id);
    return new ResponseChapterDto(updatedChapter);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeChapter(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.chapterService.removeChapter(id, req.user.id);
    return { message: 'Chapter deleted successfully' };
  }
}
