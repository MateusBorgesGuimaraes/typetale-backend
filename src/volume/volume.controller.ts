import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Body,
  Get,
} from '@nestjs/common';
import { VolumeService } from './volume.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { ResponseVolumeDto } from './dto/response-volume.dto';

@Controller('volume')
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create/:storyId')
  async createVolume(
    @Param('storyId') storyId: string,
    @Req() req: AuthenticatedRequest,
    @Body() createVolumeDto: CreateVolumeDto,
  ) {
    return this.volumeService.createVolume(
      storyId,
      req.user.id,
      createVolumeDto,
    );
  }

  @Get('/all/:storyId')
  async findAllVolumes(@Param('storyId') storyId: string) {
    const volumes = await this.volumeService.findAllVolumes(storyId);
    return volumes.map((volume) => new ResponseVolumeDto(volume));
  }
}
