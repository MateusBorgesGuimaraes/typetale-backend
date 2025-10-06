import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Body,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { VolumeService } from './volume.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { ResponseVolumeDto } from './dto/response-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

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
    const volume = await this.volumeService.createVolume(
      storyId,
      req.user.id,
      createVolumeDto,
    );
    return new ResponseVolumeDto(volume);
  }

  @Get('/:volumeId')
  async findOneVolume(@Param('volumeId') volumeId: string) {
    const volume = await this.volumeService.findOneVolume(volumeId);
    console.log('volume', volume);
    return new ResponseVolumeDto(volume);
  }

  @Get('/all/:storyId')
  async findAllVolumes(@Param('storyId') storyId: string) {
    const volumes = await this.volumeService.findAllVolumes(storyId);
    return volumes.map((volume) => new ResponseVolumeDto(volume));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:volumeId')
  async updateVolume(
    @Param('volumeId') volumeId: string,
    @Body() updatedVolume: UpdateVolumeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const volume = await this.volumeService.updateVolume(
      volumeId,
      req.user.id,
      updatedVolume,
    );
    return new ResponseVolumeDto(volume);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:volumeId')
  async removeVolume(
    @Param('volumeId') volumeId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.volumeService.removeVolume(volumeId, req.user.id);
    return { message: 'Volume deleted successfully' };
  }
}
