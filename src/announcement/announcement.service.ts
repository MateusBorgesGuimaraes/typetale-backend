import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User, UserRole } from 'src/user/entities/user.entity';
import { ResponseAnnouncementDto } from './dto/response-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateAnnouncementDto, authorId: string) {
    const author = await this.userRepository.findOneBy({ id: authorId });
    if (!author || author.role !== UserRole.PUBLISHER) {
      throw new ForbiddenException('Only publishers can create announcements');
    }
    const activeCount = await this.announcementRepository.count({
      where: { isActive: true },
    });
    if (activeCount >= 3 && createDto['isActive']) {
      throw new BadRequestException(
        'Only 3 announcements can be active at a time',
      );
    }
    const announcement = this.announcementRepository.create({
      ...createDto,
      author,
      isActive: !!createDto['isActive'],
      publishedAt: createDto['isActive'] ? new Date() : undefined,
    });
    await this.announcementRepository.save(announcement);
    return new ResponseAnnouncementDto(announcement);
  }

  async findOne(id: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return new ResponseAnnouncementDto(announcement);
  }

  async findAllActive() {
    const announcements = await this.announcementRepository.find({
      where: { isActive: true },
      order: { publishedAt: 'DESC' },
    });
    return announcements.map((a) => new ResponseAnnouncementDto(a));
  }

  async findAll() {
    const announcements = await this.announcementRepository.find({
      order: { createdAt: 'DESC' },
    });
    return announcements.map((a) => new ResponseAnnouncementDto(a));
  }

  async update(id: string, updateDto: UpdateAnnouncementDto, userId: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.author.id !== userId)
      throw new ForbiddenException(
        'Only the publisher author can update this announcement',
      );

    if (updateDto.isActive && !announcement.isActive) {
      const activeCount = await this.announcementRepository.count({
        where: { isActive: true },
      });

      if (activeCount >= 3) {
        throw new BadRequestException(
          'Only 3 announcements can be active at a time',
        );
      }
      announcement.publishedAt = new Date();
    }
    if (updateDto.isActive === false) {
      announcement.publishedAt = undefined;
    }
    Object.assign(announcement, updateDto);
    await this.announcementRepository.save(announcement);
    return new ResponseAnnouncementDto(announcement);
  }

  async remove(id: string, userId: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    if (announcement.author.id !== userId)
      throw new ForbiddenException(
        'Only the publisher author can delete this announcement',
      );
    await this.announcementRepository.delete(id);
    return { message: 'Announcement deleted successfully' };
  }
}
