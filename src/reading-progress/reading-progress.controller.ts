import {
  Controller,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';

import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@Controller('reading-progress')
@UseGuards(JwtAuthGuard)
export class ReadingProgressController {
  constructor(
    private readonly readingProgressService: ReadingProgressService,
  ) {}

  @Patch()
  async updateProgress(
    @Body() dto: UpdateReadingProgressDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.readingProgressService.updateProgress(dto, req.user.id);
  }

  @Get(':storyId')
  async getProgress(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.readingProgressService.getProgress(req.user.id, storyId);
  }

  @Get()
  async getAllProgresses(@Req() req: AuthenticatedRequest) {
    return this.readingProgressService.getAllProgresses(req.user.id);
  }
}
