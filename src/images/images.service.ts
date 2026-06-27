import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { readFile, unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import { ALLOWED_IMAGE_TYPES, IMAGES_DIRECTORY } from './images.constants';

@Injectable()
export class ImagesService {
  async validateUploadedImage(file: Express.Multer.File) {
    const buffer = await readFile(file.path);
    const isJpeg =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;
    const isPng =
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    const detectedMimeType = isJpeg
      ? 'image/jpeg'
      : isPng
        ? 'image/png'
        : isWebp
          ? 'image/webp'
          : undefined;

    if (!detectedMimeType || detectedMimeType !== file.mimetype) {
      await unlink(file.path);
      throw new BadRequestException(
        'เนื้อหาไฟล์ไม่ใช่รูป JPG, JPEG, PNG หรือ WEBP ที่ถูกต้อง',
      );
    }
  }

  async remove(filename: string) {
    const safeFilename = basename(filename);
    const allowedExtensions = new Set(Object.values(ALLOWED_IMAGE_TYPES));

    if (
      safeFilename !== filename ||
      !allowedExtensions.has(extname(safeFilename).toLowerCase())
    ) {
      throw new BadRequestException('ชื่อไฟล์รูปไม่ถูกต้อง');
    }

    try {
      await unlink(join(IMAGES_DIRECTORY, safeFilename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('ไม่พบไฟล์รูปที่ต้องการลบ');
      }

      throw error;
    }

    return {
      message: 'ลบรูปสำเร็จ',
      filename: safeFilename,
    };
  }
}
