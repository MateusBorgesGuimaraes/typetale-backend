import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateRatingDto } from './dto/update-rating.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { ResponseRatingDto } from './dto/response-rating.dto';

@UseGuards(JwtAuthGuard)
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Put(':storyId')
  updateRating(
    @Param('storyId') storyId: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ratingService.updateRating(
      storyId,
      req.user.id,
      updateRatingDto,
    );
  }

  @Get(':storyId')
  async getRating(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const rating = await this.ratingService.getUserRating(storyId, req.user.id);
    return new ResponseRatingDto(rating);
  }
}
