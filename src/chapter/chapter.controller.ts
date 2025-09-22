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
    return this.chapterService.createChapter(
      volumeId,
      req.user.id,
      createChapterDto,
    );
  }

  @Get('volume/:volumeId')
  async findAllChaptersInVolume(@Param('volumeId') volumeId: string) {
    return this.chapterService.findAllChaptersInVolume(volumeId);
  }

  @Get(':id')
  async findOneChapter(@Param('id') id: string) {
    const chapter = await this.chapterService.findOneChapter(id);
    return new ResponseChapterDto(chapter);
  }
}
