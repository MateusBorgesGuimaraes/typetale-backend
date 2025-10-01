import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateRatingDto } from 'src/rating/dto/create-rating.dto';
import { CommentTarget } from './entities/comment-entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@UseGuards(JwtAuthGuard)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentDto & { rating?: CreateRatingDto },
  ) {
    return this.commentService.create(req, createCommentDto);
  }

  @Get(':targetType/:targetId')
  async findByTarget(
    @Param('targetType', new ParseEnumPipe(CommentTarget))
    targetType: CommentTarget,
    @Param('targetId') targetId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentService.findByTarget(targetType, targetId, pagination);
  }
}
