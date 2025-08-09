import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';

export const translations = {
  en,
  hi,
  mr,
} as const;

export type TranslationNamespace = keyof typeof translations;

export { en, hi, mr };
