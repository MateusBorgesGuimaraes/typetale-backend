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
import { HighlightService } from './highlight.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@Controller('highlight')
export class HighlightController {
  constructor(private readonly highlightService: HighlightService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.highlightService.findAll(paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.highlightService.findOne(id);
  }

  @Get()
  async findAllActive() {
    return this.highlightService.findAllActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async create(
    @Body() dto: CreateHighlightDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.highlightService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHighlightDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.highlightService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.highlightService.remove(id, req.user.id);
    return { message: 'Highlight deleted successfully' };
  }
}
