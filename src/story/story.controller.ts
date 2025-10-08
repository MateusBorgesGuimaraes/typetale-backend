import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { StoryFilterDto } from './dto/story-filter.dto';

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

  @Get('/random')
  async getRandomStories() {
    return this.storyService.getRandomStories();
  }

  @Get('recently-updated')
  async getRecentlyUpdated() {
    return this.storyService.getRecentlyUpdatedStories();
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

  @Get('one/:id')
  async findOneById(@Param('id') id: string) {
    const story = await this.storyService.findOneById(id);
    return new ResponseStoryDto(story);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const story = await this.storyService.findOneBySlug(slug);
    return new ResponseStoryDetailsDto(story);
  }

  @Get()
  async findAllWithFilters(@Query() filterDto: StoryFilterDto) {
    const stories = await this.storyService.findWithFilters(filterDto);
    return {
      stories: stories.data.map((story) => new ResponseStoryDto(story)),
      meta: stories.meta,
    };
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

  @Get('top/fanfics')
  async getTopFanfics() {
    return this.storyService.getTopFanfics();
  }

  @Get('top/originals')
  async getTopOriginals() {
    return this.storyService.getTopOriginals();
  }

  @Get(':id/recommendations')
  async getRecommendations(@Param('id') id: string) {
    return this.storyService.getRecommendations(id);
  }
}
