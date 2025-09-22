import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { Repository } from 'typeorm';
import { Volume } from 'src/volume/entities/volume.entity';
import { User } from 'src/user/entities/user.entity';
import { createSlug } from 'src/common/utils/create-slug';

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter) private chapterRepository: Repository<Chapter>,
    @InjectRepository(Volume) private volumeRepository: Repository<Volume>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createChapter(
    volumeId: string,
    authorId: string,
    createChapterDto: CreateChapterDto,
  ) {
    const user = await this.userRepository.findOneBy({ id: authorId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const volume = await this.volumeRepository.findOne({
      where: { id: parseInt(volumeId) },
      relations: ['story', 'story.author'],
    });
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }

    if (volume.story.author.id !== user.id) {
      throw new NotFoundException('You are not the author of this story');
    }

    const chapter = this.chapterRepository.create({
      title: createChapterDto.title,
      slug: createSlug(createChapterDto.title),
      content: createChapterDto.content,
      isDraft: createChapterDto.isDraft,
      position: createChapterDto.position,
      publishedAt: Date.now(),
      wordsCount: createChapterDto.content.split(' ').length,
      volume: volume,
    });

    return this.chapterRepository.save(chapter);
  }

  async findAllChaptersInVolume(volumeId: string) {
    const volume = await this.volumeRepository.findOneBy({
      id: parseInt(volumeId),
    });
    if (!volume) {
      throw new NotFoundException('Volume not found');
    }
    return this.chapterRepository.find({
      where: { volume: { id: volume.id } },
    });
  }

  async findOneChapter(chapterId: string) {
    const chapter = await this.chapterRepository.findOne({
      where: { id: parseInt(chapterId) },
      relations: ['volume'],
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }
}
