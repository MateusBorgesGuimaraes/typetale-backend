import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Highlight } from './entities/highlight.entity';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { User, UserRole } from 'src/user/entities/user.entity';
import { ResponseHighlightDto } from './dto/response-highlight.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class HighlightService {
  constructor(
    @InjectRepository(Highlight)
    private readonly highlightRepository: Repository<Highlight>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createDto: CreateHighlightDto, authorId: string) {
    const author = await this.userRepository.findOneBy({ id: authorId });
    if (!author || author.role !== UserRole.PUBLISHER) {
      await this.uploadService.deleteImageFromUrl(createDto.banner);
      throw new ForbiddenException('Only publishers can create highlights');
    }

    const activeCount = await this.highlightRepository.count({
      where: { isActive: true },
    });

    if (activeCount >= 4 && createDto['isActive']) {
      await this.uploadService.deleteImageFromUrl(createDto.banner);
      throw new BadRequestException(
        'Only 4 highlights can be active at a time',
      );
    }
    const highlight = this.highlightRepository.create({
      ...createDto,
      author,
      isActive: !!createDto['isActive'],
    });
    try {
      await this.highlightRepository.save(highlight);

      return new ResponseHighlightDto(highlight);
    } catch (error) {
      await this.uploadService.deleteImageFromUrl(createDto.banner);
      throw error;
    }
  }

  async findOne(id: string) {
    const highlight = await this.highlightRepository.findOne({ where: { id } });
    if (!highlight) throw new NotFoundException('Highlight not found');
    return new ResponseHighlightDto(highlight);
  }

  async findAllActive() {
    const highlights = await this.highlightRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return highlights.map((h) => new ResponseHighlightDto(h));
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const [highlights, total] = await this.highlightRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: highlights.map((h) => new ResponseHighlightDto(h)),
      total,
      page,
      limit,
    };
  }

  async update(id: string, updateDto: UpdateHighlightDto, userId: string) {
    const highlight = await this.highlightRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!highlight) throw new NotFoundException('Highlight not found');

    if (highlight.author.id !== userId)
      throw new ForbiddenException(
        'Only the publisher author can update this highlight',
      );

    if (updateDto.isActive && !highlight.isActive) {
      const activeCount = await this.highlightRepository.count({
        where: { isActive: true },
      });
      if (activeCount >= 4) {
        throw new BadRequestException(
          'Only 4 highlights can be active at a time',
        );
      }
    }

    if (updateDto.banner !== highlight.banner) {
      await this.uploadService.deleteImageFromUrl(highlight.banner);
    }

    Object.assign(highlight, updateDto);
    await this.highlightRepository.save(highlight);
    return new ResponseHighlightDto(highlight);
  }

  async remove(id: string, userId: string) {
    const highlight = await this.highlightRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!highlight) throw new NotFoundException('Highlight not found');

    if (highlight.author.id !== userId)
      throw new ForbiddenException(
        'Only the publisher author can delete this highlight',
      );

    await this.uploadService.deleteImageFromUrl(highlight.banner);

    await this.highlightRepository.delete(id);
    return { message: 'Highlight deleted successfully' };
  }
}
