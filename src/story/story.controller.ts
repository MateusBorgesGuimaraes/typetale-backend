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
import { StoryFilterDto } from './dto/story-filter.dto';
import { StoryType } from './entities/story.entity';
import { CreateVolumeDto } from 'src/volume/dto/create-volume.dto';
import { ResponseVolumeDto } from 'src/volume/dto/response-volume.dto';
import { VolumeService } from 'src/volume/volume.service';

@Controller('story')
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly volumeService: VolumeService,
  ) {}

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
  @Post('/:storyId/volumes')
  async createVolume(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
    @Body() createVolumeDto: CreateVolumeDto,
  ) {
    const volume = await this.volumeService.create(
      storyId,
      req.user.id,
      createVolumeDto,
    );
    return new ResponseVolumeDto(volume);
  }

  @Get('/:storyId/volumes')
  async findAllVolumes(@Param('storyId') storyId: string) {
    const volumes = await this.volumeService.findAllByStoryId(storyId);
    return volumes.map((volume) => new ResponseVolumeDto(volume));
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

  @Get('top')
  async getTopStories(@Query('type') type: StoryType) {
    return this.storyService.getTopStoriesByType(type);
  }

  @Get(':id/recommendations')
  async getRecommendations(@Param('id') id: string) {
    return this.storyService.getRecommendations(id);
  }

  @Get('/:uuidOrSlug')
  async findOneById(@Param('uuidOrSlug') uuidOrSlug: string) {
    const story = await this.storyService.findOne(uuidOrSlug);
    return new ResponseStoryDto(story);
  }
}
