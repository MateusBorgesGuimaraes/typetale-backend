import { BadRequestException, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { generateRandomSuffix } from 'src/common/utils/generate-random-suffix';
import { ImageType, IMAGE_CONFIGS } from './upload.config';

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

@Injectable()
export class UploadService {
  async uploadImage(
    file: Express.Multer.File,
    imageType: ImageType,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const config = IMAGE_CONFIGS[imageType];

    if (file.size > config.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed for ${imageType} (${config.maxSize / 1024}KB)`,
      );
    }

    const fileType = await fileTypeFromBuffer(file.buffer);

    if (!fileType || !config.allowedFormats.includes(fileType.mime)) {
      throw new BadRequestException(
        `File type not allowed for ${imageType}. Allowed: ${config.allowedFormats.join(', ')}`,
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const uploadPath = resolve(
      __dirname,
      '..',
      '..',
      'uploads',
      config.folder,
      today,
    );

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${generateRandomSuffix()}`;
    const fileExtension = fileType.ext;
    const fileName = `${uniqueSuffix}.${fileExtension}`;
    const fileFullPath = resolve(uploadPath, fileName);

    writeFileSync(fileFullPath, file.buffer);

    return {
      url: `/uploads/${config.folder}/${today}/${fileName}`,
      path: fileFullPath,
      filename: fileName,
    };
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, ImageType.AVATAR);
  }

  async uploadCover(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, ImageType.COVER);
  }

  async uploadBanner(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, ImageType.BANNER);
  }

  async uploadAnnouncement(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, ImageType.ANNOUNCEMENT);
  }

  async handleUpload(file: Express.Multer.File) {
    const result = await this.uploadImage(file, ImageType.AVATAR);
    return { url: result.url };
  }
}
