import { Controller } from '@nestjs/common';
import { VolumeService } from './volume.service';

@Controller('volume')
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}
}
