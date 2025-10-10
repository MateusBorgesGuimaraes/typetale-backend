import { UploadService } from './../upload/upload.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from 'src/common/hashing/hashing.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly uploadService: UploadService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const emailExist = await this.userRepository.exists({
      where: {
        email: createUserDto.email,
      },
    });

    const usernameExist = await this.userRepository.exists({
      where: {
        username: createUserDto.username,
      },
    });

    if (usernameExist || emailExist) {
      if (createUserDto.avatarUrl)
        await this.uploadService.deleteImageFromUrl(createUserDto.avatarUrl);
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await this.hashingService.hash(
      createUserDto.password,
    );

    const newUser = this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      avatarUrl: createUserDto.avatarUrl,
    });

    try {
      const created = await this.userRepository.save(newUser);

      return created;
    } catch (error) {
      if (createUserDto.avatarUrl) {
        await this.uploadService.deleteImageFromUrl(createUserDto.avatarUrl);
      }
      throw error;
    }
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findByIdOrFail(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
