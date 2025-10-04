import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { fileFilter, limits, storage } from './upload.config';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage, limits, fileFilter }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadAvatar(file);
    return { url: result.url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', { storage, limits, fileFilter }))
  async uploadCover(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadCover(file);
    return { url: result.url };
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  @UseInterceptors(FileInterceptor('file', { storage, limits, fileFilter }))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadBanner(file);
    return { url: result.url };
  }

  @Post('announcement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('publisher')
  @UseInterceptors(FileInterceptor('file', { storage, limits, fileFilter }))
  async uploadAnnouncement(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadAnnouncement(file);
    return { url: result.url };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage, limits, fileFilter }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUpload(file);
  }
}
