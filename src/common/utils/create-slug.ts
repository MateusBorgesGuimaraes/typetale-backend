import slugify from 'slugify';
import { generateRandomSuffix } from './generate-random-suffix';

export const createSlug = (title: string) => {
  return slugify(title) + '-' + generateRandomSuffix();
};
