import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { AccessTokenGuard } from '../auth/access-token.guard';
import {
  ALLOWED_IMAGE_TYPES,
  IMAGES_DIRECTORY,
  MAX_IMAGE_SIZE,
} from './images.constants';
import { ImagesService } from './images.service';

mkdirSync(IMAGES_DIRECTORY, { recursive: true });

@Controller('images')
@UseGuards(AccessTokenGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: IMAGES_DIRECTORY,
        filename: (_request, file, callback) => {
          const extension =
            ALLOWED_IMAGE_TYPES[file.mimetype] ??
            extname(file.originalname).toLowerCase();
          let timestamp = Date.now();

          while (existsSync(join(IMAGES_DIRECTORY, `${timestamp}${extension}`))) {
            timestamp += 1;
          }

          callback(null, `${timestamp}${extension}`);
        },
      }),
      limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 1,
      },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const validMimeTypes = Object.keys(ALLOWED_IMAGE_TYPES);

        if (
          !validExtensions.includes(extension) ||
          !validMimeTypes.includes(file.mimetype)
        ) {
          return callback(
            new BadRequestException(
              'รองรับเฉพาะไฟล์ JPG, JPEG, PNG และ WEBP',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('กรุณาแนบไฟล์รูปในฟิลด์ file');
    }

    await this.imagesService.validateUploadedImage(file);

    return {
      message: 'Image uploaded successfully',
      filename: file.filename,
      path: file.path,
      url: `/images/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.imagesService.remove(filename);
  }
}
