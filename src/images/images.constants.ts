import { resolve } from 'path';

export const IMAGES_DIRECTORY = resolve(process.cwd(), 'Images');
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

