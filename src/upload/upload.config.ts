import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export enum ImageType {
  AVATAR = 'avatars',
  COVER = 'covers',
  BANNER = 'banners',
  ANNOUNCEMENT = 'announcements',
}

export interface ImageConfig {
  maxSize: number;
  allowedFormats: string[];
  folder: string;
}

export const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
  [ImageType.AVATAR]: {
    maxSize: 500 * 1024, // 500KB
    allowedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    folder: 'avatars',
  },
  [ImageType.COVER]: {
    maxSize: 1024 * 1024, // 1MB
    allowedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    folder: 'covers',
  },
  [ImageType.BANNER]: {
    maxSize: 2048 * 1024, // 2MB
    allowedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    folder: 'banners',
  },
  [ImageType.ANNOUNCEMENT]: {
    maxSize: 1024 * 1024, // 1MB
    allowedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    folder: 'announcements',
  },
};

export const storage = memoryStorage();

export const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new BadRequestException('Only images are allowed!'), false);
  }
  cb(null, true);
};

export const limits = { fileSize: 2048 * 1024 };
