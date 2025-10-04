import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';
import { UploadService } from './upload.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolve(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        fallthrough: false,
        index: false,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
