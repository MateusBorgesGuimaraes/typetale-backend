import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.announcementService.findAll(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.announcementService.findOne(id);
  }

  @Get()
  async findAllActive() {
    return this.announcementService.findAllActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async create(
    @Body() dto: CreateAnnouncementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.announcementService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.announcementService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.announcementService.remove(id, req.user.id);
    return { message: 'Announcement deleted successfully' };
  }
}
