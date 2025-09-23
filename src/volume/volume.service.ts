import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Story } from 'src/story/entities/story.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { Volume } from './entities/volume.entity';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { title } from 'process';

@Injectable()
export class VolumeService {
  constructor(
    @InjectRepository(Story) private storyRepository: Repository<Story>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
  ) {}

  async createVolume(
    storyId: string,
    authorId: string,
    createVolumeDto: CreateVolumeDto,
  ) {
    const user = await this.userRepository.findOneBy({ id: authorId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['author'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.author.id !== user.id) {
      throw new ForbiddenException('You are not the author of this story');
    }

    const volume = this.volumeRepository.create({
      title: createVolumeDto.title,
      description: createVolumeDto.description,
      position: createVolumeDto.position,
      story: story,
    });

    return this.volumeRepository.save(volume);
  }

  async findAllVolumes(storyId: string) {
    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
    });
    return volumes;
  }

  async findAllVolumesWithChapters(storyId: string) {
    const volumes = await this.volumeRepository.find({
      where: { story: { id: storyId } },
      relations: ['chapters'],
    });
    return volumes;
  }

  async findOneVolume(volumeId: string) {
    const volume = await this.volumeRepository.findOneBy({ id: +volumeId });
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }
    return volume;
  }

  async updateVolume(
    volumeId: string,
    userId: string,
    updatedVolume: UpdateVolumeDto,
  ) {
    const volume = await this.volumeRepository.findOne({
      where: { id: +volumeId },
      relations: ['story', 'story.author'],
    });

    if (!volume) {
      throw new NotFoundException('Volume not found');
    }

    if (!volume.story) {
      throw new NotFoundException('Story not found');
    }

    if (volume.story.author.id !== userId) {
      throw new ForbiddenException('You are not the author of this story');
    }

    volume.title = updatedVolume.title ?? volume.title;
    volume.description = updatedVolume.description ?? volume.description;

    await this.volumeRepository.save(volume);

    return volume;
  }
}
