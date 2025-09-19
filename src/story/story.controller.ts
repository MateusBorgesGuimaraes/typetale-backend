import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ResponseStoryDto } from './dto/response-story.dto';
import { ResponseStoryDetailsDto } from './dto/resonse-story-details.dto';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    const story = await this.storyService.create(req.user.id, createStoryDto);
    return new ResponseStoryDto(story);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findAllUserStories(@Req() req: AuthenticatedRequest) {
    const response = await this.storyService.findAllUserStories(req.user.id);

    return {
      stories: response.stories.map((story) => new ResponseStoryDto(story)),
      author: response.author,
    };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const story = await this.storyService.findOneBySlug(slug);
    return new ResponseStoryDetailsDto(story);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateById(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const story = await this.storyService.updateById(
      id,
      updateStoryDto,
      req.user.id,
    );

    return new ResponseStoryDto(story);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.storyService.deleteById(id, req.user.id);
  }
}
