import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { LibraryService } from './library.service';

import type { RemoveFromLibraryDto } from './dto/remove-from-library.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { AddToLibraryDto } from './dto/add-to-library.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('add')
  async addToLibrary(
    @Body() dto: AddToLibraryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.libraryService.addToLibrary(req.user.id, dto);
  }

  @Delete('remove')
  async removeFromLibrary(
    @Body() dto: AddToLibraryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.libraryService.removeFromLibrary(req.user.id, dto.storyId);
    return { removed: true };
  }

  @Delete('remove-many')
  async removeManyFromLibrary(
    @Body() dto: RemoveFromLibraryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.libraryService.removeManyFromLibrary(req.user.id, dto);
    return { removed: true };
  }

  @Get()
  async getLibrary(@Req() req: AuthenticatedRequest) {
    return this.libraryService.getLibrary(req.user.id);
  }
}
