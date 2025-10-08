import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ResponseRatingDto } from './dto/response-rating.dto';

@UseGuards(JwtAuthGuard)
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post(':storyId')
  async createRating(
    @Param('storyId') storyId: string,
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const rating = await this.ratingService.rateStory(
      storyId,
      req.user.id,
      createRatingDto,
    );
    return new ResponseRatingDto(rating);
  }

  @Put(':storyId')
  async updateRating(
    @Param('storyId') storyId: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const rating = await this.ratingService.updateRating(
      storyId,
      req.user.id,
      updateRatingDto,
    );
    return new ResponseRatingDto(rating);
  }

  @Get(':storyId')
  async getRating(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const rating = await this.ratingService.getUserRating(storyId, req.user.id);
    return new ResponseRatingDto(rating);
  }

  @Delete(':storyId')
  async deleteRating(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ratingService.deleteRating(storyId, req.user.id);
  }
}
